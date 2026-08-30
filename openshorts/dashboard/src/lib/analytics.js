// Lightweight custom-event helper (OpenPanel).
//
// The hosted openshorts.app build loads OpenPanel (see index.html), which
// exposes `window.op`. Self-hosted builds, ad-blockers or offline dev simply
// won't have it — every call here is a safe no-op in that case, so analytics
// can never break the app or leak into the open-source experience.
//
// Events (name — meaning):
//   - Signup             — account created / signed in
//   - QuotaWallSeen      — the 402 wall modal opened
//   - UpsellModalSeen    — the voluntary upgrade modal opened
//   - QuotaWallCheckout  — a plan/top-up clicked inside the wall modal
//   - UpsellModalCheckout— a plan/top-up clicked inside the upsell modal
//   - CheckoutStarted    — checkout clicked, on ANY surface (see `source` prop:
//                          'wall' | 'upsell' | 'pricing')
//   - CheckoutRedirected — Stripe returned a URL and we are sending them there
//   - CheckoutFailed     — /api/billing/checkout errored, `reason` says why
//   - Subscribed         — plan activated after checkout
//   - SocialNudgeSeen    — post-generation "connect socials" banner rendered
//   - SocialNudgeConnect — its connect button clicked (opens hosted connect page)
//   - SocialNudgeDismissed — its X clicked (persisted, never shown again)
// The Started → Redirected → Subscribed chain is what separates "never reached
// Stripe" from "reached Stripe and abandoned"; before 2-ago-2026 the modals
// emitted only their own *Checkout event and the difference was invisible.
// Prices ride along as ordinary props (e.g. value_usd) for breakdowns.
export function track(event, options) {
  try {
    if (typeof window !== 'undefined' && typeof window.op === 'function') {
      window.op('track', event, (options && options.props) || {});
    }
  } catch (_) {
    /* analytics must never throw into the app */
  }
}
