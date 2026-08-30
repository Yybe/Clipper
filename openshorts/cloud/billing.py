"""Stripe billing: catalog, checkout, customer portal and webhooks.

Design (matches the Stripe implementation planner for this use case):
- Stripe-hosted Checkout: subscription mode for plans, payment mode for top-ups.
- Stripe-hosted Customer Portal for self-service plan management.
- Prices resolved by stable lookup_key at runtime (no price IDs in env).
- Webhooks are idempotent (stripe_events dedupe) and order-safe (last_event_at);
  every handler upserts the full object rather than applying deltas.
"""
import asyncio
from datetime import datetime, timezone

import stripe
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from sqlalchemy import select

from .config import settings, PLAN_MINUTES, TRIAL_DAYS, SUBSCRIPTION_LOOKUP_KEYS, TOPUP_LOOKUP_KEYS
from . import config, database
from .models import User, Subscription, CreditTopup, StripeEvent
from .auth import get_current_user_required

router = APIRouter()

_catalog = None


def _init_stripe():
    stripe.api_key = settings.stripe_secret_key


def _ts(unix) -> datetime:
    return datetime.fromtimestamp(unix, tz=timezone.utc)


def _money(cents, currency="usd") -> str:
    """'$59.00' from Stripe's integer-cents + currency."""
    sym = {"usd": "$", "eur": "€", "gbp": "£"}.get((currency or "usd").lower(), "")
    return f"{sym}{(cents or 0) / 100:,.2f} {(currency or 'usd').upper()}"


# --------------------------------------------------------------------------- #
# Catalog (resolved once by lookup_key)
# --------------------------------------------------------------------------- #
async def get_catalog(force=False):
    global _catalog
    if _catalog is not None and not force:
        return _catalog
    _init_stripe()
    prices = await asyncio.to_thread(
        lambda: stripe.Price.list(
            lookup_keys=SUBSCRIPTION_LOOKUP_KEYS + TOPUP_LOOKUP_KEYS,
            expand=["data.product"], limit=100, active=True,
        )
    )
    plans, topups, by_id = [], [], {}
    for p in prices.data:
        md = p.metadata or {}
        if p.recurring:
            plan = md.get("plan")
            interval = md.get("interval") or p.recurring.get("interval")
            if plan not in PLAN_MINUTES:
                continue
            entry = {
                "kind": "subscription", "price_id": p.id, "lookup_key": p.lookup_key,
                "plan": plan, "interval": interval, "minutes": PLAN_MINUTES[plan],
                "amount": p.unit_amount, "currency": p.currency,
            }
            plans.append(entry)
        else:
            minutes = int(md.get("topup_minutes", 0))
            entry = {
                "kind": "topup", "price_id": p.id, "lookup_key": p.lookup_key,
                "minutes": minutes, "amount": p.unit_amount, "currency": p.currency,
            }
            topups.append(entry)
        by_id[p.id] = entry
    _catalog = {"plans": plans, "topups": topups, "by_id": by_id}
    return _catalog


def plan_info_for_price(price_id: str):
    """Sync lookup into the cached catalog (webhook path). Returns entry or None."""
    if _catalog is None:
        return None
    return _catalog["by_id"].get(price_id)


# --------------------------------------------------------------------------- #
# Customer helper
# --------------------------------------------------------------------------- #
async def ensure_stripe_customer(user_id, email) -> str:
    async with database.session() as s:
        async with s.begin():
            u = await s.get(User, user_id)
            if u.stripe_customer_id:
                return u.stripe_customer_id
            cust = await asyncio.to_thread(
                lambda: stripe.Customer.create(email=email, metadata={"user_id": str(user_id)})
            )
            u.stripe_customer_id = cust.id
            return cust.id


async def _blocking_sub_status(user_id):
    """Return the status of a subscription that must block a new checkout, else None."""
    async with database.session() as s:
        sub = (await s.execute(
            select(Subscription).where(Subscription.user_id == user_id)
        )).scalar_one_or_none()
    # Block a second checkout while a subscription is live or actively dunning:
    # past_due / unpaid / paused all have Stripe still retrying a charge, so a
    # fresh subscription would double-bill (real case: annual trial -> end-trial
    # -> card declined -> past_due, then a fresh monthly sub).
    #
    # 'incomplete' is deliberately NOT here. It means a checkout was started and
    # the payment never completed (3DS abandoned, card declined at confirm) —
    # nothing is being collected, and Stripe expires the row within 24h. Blocking
    # it only stops the retry, exactly when the user is most willing to pay.
    # Terminal states (canceled, incomplete_expired) do NOT block. Free-plan
    # users have no Subscription row at all, so their upgrade checkout passes.
    return sub.status if (sub and sub.status in config.CHECKOUT_BLOCKING_STATES) else None


# --------------------------------------------------------------------------- #
# Endpoints
# --------------------------------------------------------------------------- #
@router.get("/api/billing/plans")
async def list_plans():
    cat = await get_catalog()
    return {"plans": cat["plans"], "topups": cat["topups"]}


class CheckoutRequest(BaseModel):
    price_id: str


@router.post("/api/billing/checkout")
async def create_checkout(body: CheckoutRequest, request: Request):
    user = await get_current_user_required(request)
    cat = await get_catalog()
    entry = cat["by_id"].get(body.price_id)
    if not entry:
        raise HTTPException(status_code=400, detail="Unknown price")

    mode = "subscription" if entry["kind"] == "subscription" else "payment"
    if mode == "subscription":
        blocked = await _blocking_sub_status(user.id)
        if blocked in ("past_due", "unpaid"):
            # Their card failed. Telling them "you already have a plan" is both
            # false (they get no minutes) and a dead end — point at the portal.
            raise HTTPException(status_code=409, detail=(
                "Your last payment didn't go through, so we can't start a new plan "
                "yet. Update your card under Manage billing and it resumes right away."))
        if blocked:
            raise HTTPException(
                status_code=409,
                detail="You already have an active plan. Manage it from your account.")

    customer_id = await ensure_stripe_customer(user.id, user.email)
    fe = settings.frontend_url
    kwargs = dict(
        mode=mode,
        customer=customer_id,
        line_items=[{"price": body.price_id, "quantity": 1}],
        client_reference_id=str(user.id),
        success_url=f"{fe}/#/account?checkout=success",
        cancel_url=f"{fe}/#/pricing?checkout=cancel",
        allow_promotion_codes=True,
        metadata={
            "user_id": str(user.id),
            "kind": entry["kind"],
            "minutes": str(entry.get("minutes", "")),
        },
    )
    # Dead while TRIAL_DAYS == 0 (trials retired in favor of the free plan);
    # kept as the documented grandfathering mechanism.
    if mode == "subscription" and TRIAL_DAYS > 0:
        kwargs["subscription_data"] = {"trial_period_days": TRIAL_DAYS}
    session = await asyncio.to_thread(lambda: stripe.checkout.Session.create(**kwargs))
    return {"url": session.url}


@router.post("/api/billing/end-trial")
async def end_trial(request: Request):
    """End the free trial immediately: charge the card now and unlock full plan
    minutes. Kept for grandfathered trialing subscriptions — removable once
    ``SELECT count(*) FROM subscriptions WHERE status='trialing'`` reaches 0.
    Used when a trialing user hits the trial minute cap and chooses to
    activate their plan right away. The subscription webhook flips status→active
    (and thus the full ``minutes_per_period`` allowance) once Stripe confirms."""
    user = await get_current_user_required(request)
    async with database.session() as session:
        sub = (await session.execute(
            select(Subscription).where(Subscription.user_id == user.id)
        )).scalar_one_or_none()
    if not sub or sub.status != "trialing":
        raise HTTPException(status_code=409, detail="No active trial to convert.")
    try:
        updated = await asyncio.to_thread(lambda: stripe.Subscription.modify(
            sub.stripe_subscription_id, trial_end="now",
        ))
    except Exception:
        raise HTTPException(status_code=502, detail="Could not activate your plan. Try again.")
    return {"status": updated.get("status", "active")}


@router.post("/api/billing/portal")
async def create_portal(request: Request):
    user = await get_current_user_required(request)
    customer_id = await ensure_stripe_customer(user.id, user.email)
    session = await asyncio.to_thread(lambda: stripe.billing_portal.Session.create(
        customer=customer_id, return_url=f"{settings.frontend_url}/#/account",
    ))
    return {"url": session.url}


# --------------------------------------------------------------------------- #
# Webhook
# --------------------------------------------------------------------------- #
@router.post("/api/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, settings.stripe_webhook_secret)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Dedupe: if we've already recorded this event, ack and skip.
    async with database.session() as s:
        if await s.get(StripeEvent, event["id"]):
            return {"ok": True, "dedup": True}

    await handle_event(event)

    async with database.session() as s:
        async with s.begin():
            from sqlalchemy.dialects.postgresql import insert as pg_insert
            await s.execute(pg_insert(StripeEvent).values(
                id=event["id"], type=event["type"], created=_ts(event["created"]),
            ).on_conflict_do_nothing(index_elements=["id"]))
    return {"ok": True}


async def handle_event(event: dict):
    """Idempotent event dispatch. Public so tests can call it directly."""
    etype = event["type"]
    obj = event["data"]["object"]
    created = _ts(event["created"])

    if etype == "checkout.session.completed" and obj.get("mode") == "payment":
        await _apply_topup(obj)
    elif etype in ("customer.subscription.created", "customer.subscription.updated"):
        await _upsert_subscription(obj, created)
    elif etype == "customer.subscription.deleted":
        await _set_subscription_status(obj, "canceled", created)
    elif etype == "invoice.payment_failed":
        await _set_subscription_status_by_invoice(obj, "past_due", created)
    elif etype == "invoice.paid":
        await _set_subscription_status_by_invoice(obj, "active", created)
        await _notify_invoice_paid(obj)


async def _user_id_for_customer(session, customer_id):
    return (await session.execute(
        select(User.id).where(User.stripe_customer_id == customer_id)
    )).scalar_one_or_none()


async def _apply_topup(session_obj: dict):
    """Credit a top-up from a completed one-off Checkout (idempotent by session id)."""
    session_id = session_obj["id"]
    minutes = int((session_obj.get("metadata") or {}).get("minutes") or 0)
    if minutes <= 0:
        return
    buyer_email = None
    async with database.session() as s:
        async with s.begin():
            existing = (await s.execute(
                select(CreditTopup).where(CreditTopup.stripe_session_id == session_id)
            )).scalar_one_or_none()
            if existing:
                return
            # The id rides in Stripe's metadata, so it can name an account that
            # no longer exists: a checkout completed moments before the user
            # erased themselves, or any webhook Stripe retries afterwards.
            # Inserting it blind trips the foreign key, and because the event is
            # only recorded after handle_event returns, the 500 makes Stripe
            # retry the same doomed insert for three days.
            user_id = (session_obj.get("metadata") or {}).get("user_id")
            if user_id:
                try:
                    user_id = (await s.execute(
                        select(User.id).where(User.id == user_id)
                    )).scalar_one_or_none()
                except Exception:
                    user_id = None  # not a uuid at all
            if not user_id:
                user_id = await _user_id_for_customer(s, session_obj.get("customer"))
            if not user_id:
                return
            s.add(CreditTopup(
                user_id=user_id, stripe_session_id=session_id,
                minutes_total=minutes, minutes_consumed=0,
            ))
            buyer_email = (await s.execute(
                select(User.email).where(User.id == user_id)
            )).scalar_one_or_none()

    amount_txt = ""
    total = session_obj.get("amount_total")
    if total:
        amount_txt = f" ({_money(total, session_obj.get('currency'))})"
    from .alerts import send_admin_alert
    await send_admin_alert(
        f"💰 Top-up purchased{amount_txt}",
        f"{buyer_email or 'A user'} bought +{minutes} minutes.",
    )


def _sub_item(sub_obj: dict):
    try:
        return sub_obj["items"]["data"][0]
    except Exception:
        return {}


def _sub_price_id(sub_obj: dict):
    try:
        return _sub_item(sub_obj)["price"]["id"]
    except Exception:
        return None


def _sub_period(sub_obj: dict):
    """Return (start, end) unix timestamps, from the subscription or its item.

    Newer Stripe API versions expose current_period_* on the item, older ones on
    the subscription itself — support both.
    """
    item = _sub_item(sub_obj)
    start = sub_obj.get("current_period_start") or item.get("current_period_start")
    end = sub_obj.get("current_period_end") or item.get("current_period_end")
    return start, end


async def _upsert_subscription(sub_obj: dict, event_created: datetime):
    price_id = _sub_price_id(sub_obj)
    info = plan_info_for_price(price_id)
    if info is None:
        await get_catalog(force=True)
        info = plan_info_for_price(price_id)
    if info is None:
        return  # unknown price — ignore
    plan = info["plan"]
    interval = info["interval"]
    minutes = PLAN_MINUTES[plan]

    async with database.session() as s:
        async with s.begin():
            user_id = await _user_id_for_customer(s, sub_obj.get("customer"))
            if not user_id:
                return
            row = (await s.execute(
                select(Subscription).where(Subscription.user_id == user_id).with_for_update()
            )).scalar_one_or_none()
            # Order guard: ignore events older than what we've already applied.
            if row and row.last_event_at and event_created < row.last_event_at:
                return
            # Cross-subscription guard: the table keeps one row per user, so an
            # event for a *different* subscription of the same user must not clobber
            # the row that represents their live plan. This is exactly what happens
            # when a user has a dangling sub (e.g. a past_due annual that gets
            # canceled) alongside a live one (a trialing monthly): the canceled
            # sub's update would otherwise overwrite the good row. Only let another
            # subscription take over when the stored one is no longer live.
            if row and row.stripe_subscription_id != sub_obj["id"]:
                stored_live = row.status in ("active", "trialing", "past_due", "unpaid")
                incoming_live = sub_obj.get("status") in ("active", "trialing", "past_due")
                if stored_live and not incoming_live:
                    return
            start, end = _sub_period(sub_obj)
            now_canceling = bool(sub_obj.get("cancel_at_period_end"))
            # Detect the moment the user hits "cancel" (False -> True).
            was_canceling = bool(row.cancel_at_period_end) if row else False
            just_canceled = now_canceling and not was_canceling
            # Purchase signals: brand-new subscription, and trial -> paid conversion.
            is_new_sub = row is None
            prev_status = row.status if row else None
            buyer_email = (await s.execute(
                select(User.email).where(User.id == user_id)
            )).scalar_one_or_none()
            end_dt = _ts(end)
            values = dict(
                stripe_subscription_id=sub_obj["id"],
                stripe_price_id=price_id,
                plan=plan, interval=interval, status=sub_obj["status"],
                minutes_per_period=minutes,
                current_period_start=_ts(start),
                current_period_end=end_dt,
                cancel_at_period_end=now_canceling,
                last_event_at=event_created,
            )
            if row is None:
                s.add(Subscription(user_id=user_id, **values))
            else:
                for k, v in values.items():
                    setattr(row, k, v)

    # Purchase alert: someone just subscribed (trial started or paid outright).
    now_status = sub_obj["status"]
    if is_new_sub:
        from .alerts import send_admin_alert
        label = "trial started — card on file" if now_status == "trialing" else now_status
        await send_admin_alert(
            "🎉 New subscriber",
            f"{buyer_email or 'A user'} started the {plan} ({interval}) plan.\nStatus: {label}.",
        )
    elif prev_status == "trialing" and now_status == "active":
        from .alerts import send_admin_alert
        await send_admin_alert(
            "💳 Trial converted to paid",
            f"{buyer_email or 'A user'} is now a paying {plan} ({interval}) subscriber. 🎉",
        )

    # Churn alert to the admin the moment a subscription is set to cancel.
    if just_canceled:
        from .alerts import send_admin_alert
        from .config import VIDEO_RETENTION_GRACE_DAYS
        await send_admin_alert(
            "🔻 Subscription canceled",
            f"A {plan} subscriber just canceled.\n"
            f"Access continues until {end_dt:%Y-%m-%d}. Google-authed users then "
            f"drop to the free plan (clips expire after 7 days); others keep their "
            f"videos {VIDEO_RETENTION_GRACE_DAYS} more days before deletion.",
        )


async def _set_subscription_status(sub_obj: dict, status: str, event_created: datetime):
    async with database.session() as s:
        async with s.begin():
            row = (await s.execute(
                select(Subscription).where(
                    Subscription.stripe_subscription_id == sub_obj["id"]
                ).with_for_update()
            )).scalar_one_or_none()
            if row is None:
                return
            if row.last_event_at and event_created < row.last_event_at:
                return
            row.status = status
            row.last_event_at = event_created


async def _set_subscription_status_by_invoice(invoice_obj: dict, status: str, event_created: datetime):
    sub_id = invoice_obj.get("subscription")
    if not sub_id:
        return
    await _set_subscription_status({"id": sub_id}, status, event_created)


async def _notify_invoice_paid(invoice_obj: dict):
    """Real money-in alert: every paid invoice — first charge AND every monthly
    renewal (renewals were previously silent). Includes the amount."""
    amount = invoice_obj.get("amount_paid", 0)
    if amount <= 0:                       # $0 invoices (e.g. legacy trial start)
        return
    money = _money(amount, invoice_obj.get("currency"))
    reason = invoice_obj.get("billing_reason") or ""
    kind = {
        "subscription_create": "new subscription",
        "subscription_cycle": "renewal",
        "subscription_update": "plan change",
    }.get(reason, reason or "payment")

    email = None
    async with database.session() as s:
        cust = invoice_obj.get("customer")
        if cust:
            email = (await s.execute(
                select(User.email).where(User.stripe_customer_id == cust)
            )).scalar_one_or_none()

    from .alerts import send_admin_alert
    await send_admin_alert(
        f"💵 Payment received: {money}",
        f"{email or 'A customer'} — {kind}.",
    )
