/* Legal pages: Terms of Service, Privacy Policy and Legal Notice, in English
 * and Spanish. Spanish versions are not a nicety: Art. 60.1 TRLGDCU requires
 * pre-contractual information "at least in Castilian Spanish" for consumers in
 * Spain, and the AEPD has fined sites whose privacy policy existed only in a
 * foreign language. The prevalence clause (Spanish version wins for consumers
 * resident in Spain) lives in each document.
 *
 * These pages are emitted as static HTML like the marketing pages, and appear
 * in sitemap.xml and llms.txt, but stay OUT of the marketing interlinking
 * ring: they are reachable from the footer, which is where people (and
 * crawlers) expect them.
 *
 * Substantive choices are documented in the repo history: consumer-withdrawal
 * wording follows arts. 98.8/103.a/108 TRLGDCU as read after CJEU C-234/25
 * (SaaS is a digital service, not digital content — the right survives but is
 * paid pro-rata); the 15-day renewal reminder follows Ley 10/2025; the
 * moderation/takedown sections implement DSA arts. 11-17 for a hosting
 * service; AI labelling follows AI Act art. 50.
 */

const PUBLISHED = '2026-08-24'

const TERMS_EN = `
<h2>1. Who we are</h2>
<p>OpenShorts Cloud (openshorts.app) is operated by TONVI TECH SL, a company
incorporated in Spain, CIF B-19780394, with registered address at Calle Puerta
del Mar 18, 5th floor, 29005 Málaga, Spain ("OpenShorts", "we", "us"). You can
reach us at info@openshorts.app. These Terms of Service ("Terms") govern your
use of the hosted service at openshorts.app.</p>
<p>The open-source edition of OpenShorts that you can download and run on your
own hardware is licensed separately under the MIT License and is not covered by
these Terms: when you self-host, you are the operator of your instance and
these Terms do not apply to it.</p>
<p>These Terms are also available in <a href="/terminos">Spanish</a>. For
consumers resident in Spain, the Spanish version prevails in case of
discrepancy.</p>

<h2>2. The service</h2>
<p>OpenShorts turns long-form video into short vertical clips. On your
instruction, the service ingests a video you upload or a video located at a URL
you provide, transcribes it, uses AI models to select moments, reframes it to
vertical, and optionally adds subtitles, text overlays, AI dubbing, and
publishes the result to social media accounts you connect. The service is
available as a free plan with usage limits and a watermark, and as paid
subscriptions and top-ups billed through Stripe.</p>

<h2>3. Eligibility and accounts</h2>
<p>You must be at least 16 years old, or the age of digital consent in your
country if it is higher. You are responsible for everything done through your
account and your API keys. Keep your access credentials confidential and tell
us at info@openshorts.app if you believe your account has been compromised.</p>

<h2>4. Your content stays yours</h2>
<p>You keep all ownership of the videos you submit. By submitting content, you
grant us a worldwide, non-exclusive, royalty-free licence to host, store,
reproduce, transcode, modify and process that content, and to display it back
to you, strictly to the extent needed to operate and secure the service. This
licence ends when the content is deleted from our systems under the retention
rules in Section 13, except for backup copies kept for a limited period and
content we must keep to comply with the law.</p>
<p><strong>The clips are yours.</strong> As between you and us, you own the
output clips the service generates from your content, including for commercial
use, to the extent of our rights in them. On the free plan, clips carry an
OpenShorts watermark; you may use watermarked clips freely but you may not
remove or obscure the watermark by any means other than upgrading to a paid
plan.</p>
<p>We do not use your content to train AI models — ours or anyone else's. See
Section 7.</p>
<p>With your separate permission (for example, if you reply yes when we ask), we
may mention your name or showcase your public clips as customer references. We
never do this by default.</p>

<h2>5. Your promises about the content</h2>
<p>The service processes content on your instruction — both files you upload
and videos you direct us to fetch from a URL. You promise that, for every video
you submit by either route:</p>
<ul>
<li>you own it, or you hold the rights or permissions needed to download,
process, edit and republish it;</li>
<li>your use of it through the service does not infringe anyone's copyright,
trademark, image or publicity rights, or the terms of the platform it came
from;</li>
<li>it does not feature any identifiable person's image or voice without the
authorisation the law requires; and</li>
<li>if you use AI dubbing, you have the voice owner's consent to generate
synthetic speech from their voice.</li>
</ul>
<p>When you submit a job you tick a declaration confirming this. We record that
declaration together with the date, your IP address and browser identifier, and
we may produce that record if a dispute arises. Submitting other people's
content without permission is the thing most likely to get an account
terminated under Section 16.</p>

<h2>6. Personal data in your videos — our role as processor</h2>
<p>Videos often contain personal data of the people who appear in them. For
that data, you are the controller and we act as your processor under Article 28
GDPR: we process the footage only on your documented instructions (the jobs you
submit), we engage only the sub-processors listed in our
<a href="/privacy">Privacy Policy</a> (AI, storage and delivery providers), we
apply appropriate security measures, and we delete the content under the
retention rules in Section 13 or earlier on your instruction. If you need a
countersigned Data Processing Agreement for your business, request it at
info@openshorts.app. When you use bring-your-own-key mode, your content flows
directly between your instance and the AI provider under your own agreement
with them.</p>

<h2>7. AI processing — what runs where</h2>
<p>The service uses AI systems to do its work, and we name them: transcription
runs on our own servers (Whisper-family and NVIDIA Parakeet models); moment
selection, titling and layout decisions use Google's Gemini API; optional voice
dubbing uses ElevenLabs. Your video content, audio and transcript are sent to
these providers only as needed to perform the job you requested, under
agreements that prohibit them from using paid-API customer data to train their
models.</p>
<p><strong>We do not train AI models on your content, and we do not sell it or
share it for training.</strong></p>
<p>AI output is probabilistic: clip selections, transcripts, translations,
titles and dubbed audio may contain errors, and similar inputs can produce
similar outputs for different customers, so results are not guaranteed to be
unique. You are responsible for reviewing AI output before you use or publish
it. You may not use the service or its output to develop or train a competing
model or service.</p>
<p>Clips that use AI dubbing contain synthetic speech. We label and mark dubbed
clips as AI-generated as required of us by Regulation (EU) 2024/1689 (the AI
Act); you must not remove or strip those labels, marks or content credentials.
When you publish a dubbed clip, disclosing its synthetic nature to your
audience in the manner your platform and local law require is your
responsibility as the publisher.</p>

<h2>8. Acceptable use</h2>
<p>You may not use the service to:</p>
<ul>
<li>process or distribute content that is unlawful, defamatory, harassing,
hateful, sexually exploitative of minors, or that incites violence;</li>
<li>infringe intellectual property, image or privacy rights, including
submitting URLs of content you have no rights to;</li>
<li>impersonate any person, or produce media of an identifiable person's image
or voice without authorisation (deepfakes);</li>
<li>probe, disrupt or overload the service, scrape it, or access it by any
automated means other than the documented API and MCP endpoints within their
rate limits;</li>
<li>reverse engineer the hosted service or attempt to extract its models,
prompts or non-public components;</li>
<li>sell, transfer or share API keys, accounts or quota, or create multiple
accounts to evade free-plan limits;</li>
<li>artificially manipulate engagement metrics on any platform you publish
to.</li>
</ul>
<p>This section, together with Sections 5 and 9, is our content moderation
policy for the purposes of Article 14 of Regulation (EU) 2022/2065 (DSA):
content that breaches it may be removed and accounts that breach it may be
throttled, suspended or terminated, with reasons given to the affected user. We
may block re-registration by the same person after a termination for abuse.</p>

<h2>9. Copyright complaints and content takedown</h2>
<p>If you believe content processed or hosted through the service infringes
your rights, email info@openshorts.app (our point of contact for users and
authorities under Articles 11 and 12 DSA) with: your name and contact details,
the work you own, the exact URL or identifier of the infringing material, a
statement in good faith that the use is unauthorised, and your signature. We
review notices promptly, remove or disable access to content when the notice is
substantiated, and inform the affected user with reasons; the affected user may
reply with a substantiated counter-notice. We terminate the accounts of repeat
infringers. This procedure implements the notice-and-action mechanism of
Article 16 DSA.</p>

<h2>10. Publishing to your social accounts</h2>
<p>If you connect social accounts (via our publishing partner, Upload-Post),
you expressly authorise us and our partner to publish content to those accounts
on your instruction. You remain the publisher of everything posted: you are
responsible for the content, its scheduling and its compliance with each
platform's terms (YouTube, TikTok, Instagram and the rest). You can disconnect
your accounts at any time from the dashboard or from the platform's own
settings, which revokes our access.</p>

<h2>11. Plans, billing and renewals</h2>
<p>Paid subscriptions and minute top-ups are billed by Stripe; we never see or
store your card number. Prices are shown with any applicable taxes indicated at
checkout. Subscriptions renew automatically at the end of each billing period
until you cancel. You can cancel at any time
from your account page, as easily as you subscribed; cancellation takes effect
at the end of the current period, which you keep using in full. Unused quota
does not roll over unless the plan says otherwise. We will give you at least 30
days' notice by email before any price increase takes effect, and you may
cancel before it applies.</p>

<h2>12. Right of withdrawal (EU consumers)</h2>
<p>If you are a consumer in the EU, you have a statutory right to withdraw from
a distance contract within 14 days without giving a reason. When you subscribe,
you expressly request that the service start immediately, within the withdrawal
period. You keep your right of withdrawal during those 14 days, but if you
exercise it you will pay the proportional part of the service already provided,
and the right is lost once the service has been fully performed (Articles 98.8,
103.a and 108 of the Spanish Consumer Act, implementing Directive 2011/83/EU).
Automatic renewals of an ongoing subscription do not open a new withdrawal
period. To withdraw, email info@openshorts.app or use the model form we include
in your confirmation email; refunds are issued to the original payment method
within 14 days.</p>

<h2>13. Content retention and deletion</h2>
<p>Generated clips on the free plan are stored for 7 days and then permanently
deleted; we email you before it happens. Download what you want to keep. On
paid plans, your projects and clips remain stored while your subscription is
active and are deleted 7 days after it ends unless you delete them earlier.
Deleting your account deletes your content on the same schedule, subject to
short-lived backups and to records we must keep by law (such as invoicing
data). We are not liable for the loss of content whose deletion these Terms
announced.</p>

<h2>14. Disclaimers</h2>
<p>The service is provided "as is" and "as available", without warranties of
uninterrupted availability, error-free operation, or fitness for a particular
purpose, to the extent such disclaimers are permitted by the law of your
residence. Nothing in these Terms limits warranties or rights that consumer law
grants you and that cannot be waived.</p>

<h2>15. Liability</h2>
<p>To the maximum extent permitted by law, our total aggregate liability for
claims arising out of the service is limited to the amounts you paid us in the
12 months before the event giving rise to the claim, and we are not liable for
indirect or consequential damages, loss of profits, or loss of data whose
deletion was announced in Section 13. This limitation does not apply to damages
caused by our wilful misconduct or gross negligence, to death or personal
injury, or to any liability that cannot be limited under Spanish or EU law.</p>

<h2>16. Indemnity, suspension and termination</h2>
<p>If a third party brings a claim against us because of content you submitted
or instructed us to fetch, or because of your breach of these Terms, you will
indemnify us — including our directors, employees and suppliers — for the
resulting damages, penalties and reasonable defence costs, except to the extent
the claim results from our own breach. If you are a consumer, this obligation
applies only to claims caused by your breach of these Terms or of the law.</p>
<p>We may suspend or terminate accounts for material breach. Where the breach
is curable we will tell you first and give you a reasonable period to fix it;
where it is not (illegal content, repeat infringement, abuse, fraud), we may
suspend immediately, giving you reasons. After termination you have 7 days to
download your remaining content unless the law requires us to remove it.
Sections 4 to 9 and 14 to 18 survive termination.</p>

<h2>17. Changes to the service and these Terms</h2>
<p>We improve the service continuously and may change or retire features. We
may amend these Terms; material changes will be announced by email or in-app at
least 15 days in advance, and continuing to use the service after they take
effect constitutes acceptance. If you do not agree, cancel before the new terms
apply and we will refund any unused prepaid period.</p>

<h2>18. Governing law and disputes</h2>
<p>These Terms are governed by Spanish law, without prejudice to the mandatory
consumer protection rules of your country of residence. Disputes are submitted
to the courts of Málaga, Spain — except that if you are a consumer, you keep
the right to sue and be sued in the courts of your own domicile, and you may
use the consumer mediation and arbitration bodies available in your country of
residence. Complaints route: write to info@openshorts.app first; most issues
are fixed in days.</p>
`

const TERMS_ES = `
<h2>1. Quiénes somos</h2>
<p>OpenShorts Cloud (openshorts.app) es un servicio prestado por TONVI TECH SL,
sociedad española con CIF B-19780394 y domicilio en Calle Puerta del Mar 18,
5ª planta, 29005 Málaga, España ("OpenShorts", "nosotros"). Puedes escribirnos
a info@openshorts.app. Estos Términos de Servicio ("Términos") regulan el uso
del servicio alojado en openshorts.app.</p>
<p>La edición de código abierto de OpenShorts que puedes descargar y ejecutar
en tu propio hardware se licencia por separado bajo la Licencia MIT y no está
cubierta por estos Términos: cuando te autoalojas, el operador de tu instancia
eres tú.</p>
<p>Estos Términos están también disponibles en <a href="/terms">inglés</a>.
Para consumidores residentes en España prevalece la versión en castellano en
caso de discrepancia.</p>

<h2>2. El servicio</h2>
<p>OpenShorts convierte vídeo largo en clips verticales cortos. Siguiendo tu
instrucción, el servicio ingiere un vídeo que subes o un vídeo situado en la
URL que indicas, lo transcribe, usa modelos de IA para seleccionar momentos, lo
reencuadra en vertical y, opcionalmente, añade subtítulos, rótulos, doblaje con
IA y publica el resultado en las cuentas de redes sociales que conectes. Existe
un plan gratuito con límites de uso y marca de agua, y suscripciones y recargas
de pago facturadas a través de Stripe.</p>

<h2>3. Requisitos y cuentas</h2>
<p>Debes tener al menos 16 años, o la edad de consentimiento digital de tu país
si es mayor. Eres responsable de todo lo que se haga con tu cuenta y tus claves
API. Mantén tus credenciales en secreto y avísanos en info@openshorts.app si
crees que tu cuenta está comprometida.</p>

<h2>4. Tu contenido sigue siendo tuyo</h2>
<p>Conservas la propiedad de los vídeos que envías. Al enviarlos nos concedes
una licencia mundial, no exclusiva y gratuita para alojarlos, almacenarlos,
reproducirlos, transcodificarlos, modificarlos y procesarlos, y para
mostrártelos, estrictamente en la medida necesaria para operar y proteger el
servicio. Esta licencia termina cuando el contenido se elimina de nuestros
sistemas según las reglas de conservación de la cláusula 13, salvo copias de
seguridad de duración limitada y lo que la ley nos obligue a conservar.</p>
<p><strong>Los clips son tuyos.</strong> Entre tú y nosotros, los clips que el
servicio genera a partir de tu contenido te pertenecen, incluido su uso
comercial, en la medida de nuestros derechos sobre ellos. En el plan gratuito
los clips llevan una marca de agua de OpenShorts; puedes usarlos libremente,
pero no puedes eliminarla ni ocultarla por otro medio que no sea pasar a un
plan de pago.</p>
<p>No usamos tu contenido para entrenar modelos de IA — ni nuestros ni de
terceros. Ver cláusula 7.</p>
<p>Con tu permiso expreso (por ejemplo, si nos dices que sí cuando te lo
pidamos) podremos citarte como cliente o mostrar tus clips públicos como
referencia. Nunca lo hacemos por defecto.</p>

<h2>5. Lo que garantizas sobre el contenido</h2>
<p>El servicio procesa contenido siguiendo tu instrucción — tanto archivos que
subes como vídeos que nos ordenas descargar desde una URL. Garantizas que, para
cada vídeo que envías por cualquiera de las dos vías:</p>
<ul>
<li>es tuyo, o cuentas con los derechos o permisos necesarios para
descargarlo, procesarlo, editarlo y volver a publicarlo;</li>
<li>tu uso a través del servicio no infringe derechos de autor, marcas,
derechos de imagen o publicidad de nadie, ni las condiciones de la plataforma
de origen;</li>
<li>no aparece la imagen o la voz de ninguna persona identificable sin la
autorización que exige la ley; y</li>
<li>si usas el doblaje con IA, cuentas con el consentimiento del titular de la
voz para generar voz sintética a partir de ella.</li>
</ul>
<p>Al enviar un trabajo marcas una declaración que lo confirma. Guardamos esa
declaración junto con la fecha, tu dirección IP y el identificador de tu
navegador, y podremos aportar ese registro si surge una disputa. Enviar
contenido ajeno sin permiso es lo que con más probabilidad termina en la
cancelación de una cuenta según la cláusula 16.</p>

<h2>6. Datos personales en tus vídeos — nuestro papel de encargado</h2>
<p>Los vídeos suelen contener datos personales de quienes aparecen en ellos.
Respecto de esos datos tú eres el responsable del tratamiento y nosotros
actuamos como tu encargado conforme al artículo 28 del RGPD: tratamos el
material solo según tus instrucciones documentadas (los trabajos que envías),
recurrimos únicamente a los subencargados listados en la
<a href="/privacidad">Política de Privacidad</a> (proveedores de IA,
almacenamiento y entrega), aplicamos medidas de seguridad apropiadas y
eliminamos el contenido según las reglas de la cláusula 13 o antes si nos lo
pides. Si tu empresa necesita un contrato de encargo de tratamiento firmado,
solicítalo en info@openshorts.app. En el modo con claves propias (BYOK), tu
contenido fluye directamente entre tu instancia y el proveedor de IA bajo tu
propio acuerdo con él.</p>

<h2>7. Procesamiento con IA — qué se ejecuta y dónde</h2>
<p>El servicio usa sistemas de IA y los nombramos: la transcripción se ejecuta
en nuestros propios servidores (modelos de la familia Whisper y NVIDIA
Parakeet); la selección de momentos, los títulos y las decisiones de encuadre
usan la API Gemini de Google; el doblaje de voz opcional usa ElevenLabs. Tu
vídeo, audio y transcripción se envían a estos proveedores solo en la medida
necesaria para realizar el trabajo que pediste, bajo acuerdos que les prohíben
usar los datos de clientes de API de pago para entrenar sus modelos.</p>
<p><strong>No entrenamos modelos de IA con tu contenido, ni lo vendemos ni lo
cedemos para entrenamiento.</strong></p>
<p>El resultado de la IA es probabilístico: las selecciones de clips,
transcripciones, traducciones, títulos y audio doblado pueden contener errores,
y entradas similares pueden producir salidas similares para distintos clientes,
por lo que los resultados no se garantizan únicos. Eres responsable de revisar
el resultado antes de usarlo o publicarlo. No puedes usar el servicio ni sus
resultados para desarrollar o entrenar un modelo o servicio competidor.</p>
<p>Los clips con doblaje de IA contienen voz sintética. Etiquetamos y marcamos
los clips doblados como generados con IA según nos exige el Reglamento (UE)
2024/1689 (Reglamento de IA); no debes eliminar esas etiquetas, marcas ni
credenciales de contenido. Al publicar un clip doblado, informar a tu audiencia
de su naturaleza sintética en la forma que exijan tu plataforma y tu ley local
es tu responsabilidad como editor.</p>

<h2>8. Uso aceptable</h2>
<p>No puedes usar el servicio para:</p>
<ul>
<li>procesar o distribuir contenido ilegal, difamatorio, acosador, de odio,
de explotación sexual de menores o que incite a la violencia;</li>
<li>infringir propiedad intelectual, derechos de imagen o privacidad,
incluido enviar URLs de contenido sobre el que no tienes derechos;</li>
<li>suplantar a nadie ni producir medios con la imagen o la voz de una persona
identificable sin autorización (deepfakes);</li>
<li>sondear, interrumpir o sobrecargar el servicio, hacer scraping, o acceder
por medios automatizados distintos de la API y el endpoint MCP documentados y
dentro de sus límites de uso;</li>
<li>hacer ingeniería inversa del servicio alojado o intentar extraer sus
modelos, prompts o componentes no públicos;</li>
<li>vender, transferir o compartir claves API, cuentas o cuota, o crear varias
cuentas para eludir los límites del plan gratuito;</li>
<li>manipular artificialmente métricas de interacción en las plataformas donde
publiques.</li>
</ul>
<p>Esta cláusula, junto con las cláusulas 5 y 9, constituye nuestra política de
moderación de contenidos a efectos del artículo 14 del Reglamento (UE)
2022/2065 (DSA): el contenido que la incumpla podrá retirarse y las cuentas
podrán limitarse, suspenderse o cancelarse, motivándolo ante el afectado.
Podemos bloquear el re-registro de la misma persona tras una cancelación por
abuso.</p>

<h2>9. Reclamaciones de derechos de autor y retirada de contenido</h2>
<p>Si crees que contenido procesado o alojado a través del servicio infringe
tus derechos, escribe a info@openshorts.app (nuestro punto de contacto para
usuarios y autoridades según los artículos 11 y 12 de la DSA) indicando: tu
nombre y datos de contacto, la obra de la que eres titular, la URL o el
identificador exacto del material infractor, una declaración de buena fe de que
el uso no está autorizado, y tu firma. Revisamos los avisos con diligencia,
retiramos o bloqueamos el contenido cuando el aviso está fundado e informamos
motivadamente al usuario afectado, que podrá responder con una contra-
notificación fundada. Cancelamos las cuentas de los infractores reincidentes.
Este procedimiento aplica el mecanismo de notificación y acción del artículo 16
de la DSA.</p>

<h2>10. Publicación en tus cuentas sociales</h2>
<p>Si conectas cuentas sociales (a través de nuestro socio de publicación,
Upload-Post), nos autorizas expresamente a nosotros y a nuestro socio a
publicar contenido en esas cuentas siguiendo tu instrucción. Tú sigues siendo
el editor de todo lo publicado: respondes del contenido, de su programación y
de su conformidad con las condiciones de cada plataforma (YouTube, TikTok,
Instagram y las demás). Puedes desconectar tus cuentas en cualquier momento
desde el panel o desde los ajustes de la propia plataforma, lo que revoca
nuestro acceso.</p>

<h2>11. Planes, facturación y renovaciones</h2>
<p>Las suscripciones y recargas de pago se facturan a través de Stripe; nunca
vemos ni almacenamos tu número de tarjeta. Los precios indican en el proceso de
pago los impuestos aplicables. Las suscripciones se renuevan automáticamente al
final de cada periodo hasta que canceles.
Puedes cancelar en cualquier momento desde tu cuenta, con la misma facilidad
con la que te suscribiste; la cancelación surte efecto al final del periodo en
curso, que sigues disfrutando íntegro. La cuota no consumida no se acumula
salvo que el plan diga lo contrario. Te avisaremos por email con al menos 30
días de antelación antes de cualquier subida de precio, y podrás cancelar antes
de que se aplique.</p>

<h2>12. Derecho de desistimiento (consumidores UE)</h2>
<p>Si eres consumidor en la UE, tienes derecho a desistir del contrato a
distancia en un plazo de 14 días naturales sin necesidad de justificación. Al
suscribirte solicitas expresamente que el servicio comience de inmediato,
dentro del plazo de desistimiento. Conservas tu derecho durante esos 14 días,
pero si lo ejerces abonarás la parte proporcional del servicio ya prestado, y
el derecho se pierde una vez el servicio se ha ejecutado por completo
(artículos 98.8, 103.a y 108 del TRLGDCU, que transponen la Directiva
2011/83/UE). Las renovaciones automáticas de una suscripción en curso no abren
un nuevo plazo de desistimiento. Para desistir, escribe a info@openshorts.app o
usa el formulario modelo que incluimos en tu email de confirmación; los
reembolsos se emiten al medio de pago original en un máximo de 14 días.</p>

<h2>13. Conservación y eliminación del contenido</h2>
<p>Los clips generados en el plan gratuito se conservan 7 días y después se
eliminan de forma permanente; te avisamos por email antes de que ocurra.
Descarga lo que quieras conservar. En los planes de pago, tus proyectos y clips
permanecen almacenados mientras tu suscripción esté activa y se eliminan 7
días después de su fin, salvo que los borres antes. Eliminar tu cuenta elimina
tu contenido con el mismo calendario, sin perjuicio de copias de seguridad de
corta duración y de los registros que la ley nos obligue a conservar (como los
datos de facturación). No respondemos de la pérdida de contenido cuya
eliminación estos Términos anunciaban.</p>

<h2>14. Exclusión de garantías</h2>
<p>El servicio se presta "tal cual" y "según disponibilidad", sin garantía de
disponibilidad ininterrumpida, funcionamiento sin errores o idoneidad para un
fin concreto, en la medida en que la ley de tu residencia permita estas
exclusiones. Nada en estos Términos limita las garantías o derechos que la
normativa de consumo te reconoce con carácter irrenunciable.</p>

<h2>15. Responsabilidad</h2>
<p>En la máxima medida permitida por la ley, nuestra responsabilidad total
agregada por reclamaciones derivadas del servicio se limita a las cantidades
que nos hayas pagado en los 12 meses anteriores al hecho que origine la
reclamación, y no respondemos de daños indirectos, lucro cesante ni de la
pérdida de datos cuya eliminación anunciaba la cláusula 13. Esta limitación no
se aplica a los daños causados por dolo o negligencia grave, a los daños
personales, ni a ninguna responsabilidad que no pueda limitarse conforme al
Derecho español o de la UE.</p>

<h2>16. Indemnidad, suspensión y cancelación</h2>
<p>Si un tercero nos reclama por contenido que enviaste o nos ordenaste
descargar, o por tu incumplimiento de estos Términos, nos mantendrás indemnes —
incluidos nuestros administradores, empleados y proveedores — de los daños,
sanciones y costes razonables de defensa resultantes, salvo en la medida en que
la reclamación derive de nuestro propio incumplimiento. Si eres consumidor,
esta obligación se aplica únicamente a reclamaciones causadas por tu
incumplimiento de estos Términos o de la ley.</p>
<p>Podemos suspender o cancelar cuentas por incumplimiento grave. Si el
incumplimiento es subsanable te avisaremos primero y te daremos un plazo
razonable para corregirlo; si no lo es (contenido ilegal, reincidencia en
infracciones, abuso, fraude), podremos suspender de inmediato, motivándolo.
Tras la cancelación dispones de 7 días para descargar el contenido restante,
salvo que la ley nos obligue a retirarlo. Las cláusulas 4 a 9 y 14 a 18
sobreviven a la terminación.</p>

<h2>17. Cambios en el servicio y en estos Términos</h2>
<p>Mejoramos el servicio continuamente y podemos cambiar o retirar funciones.
Podemos modificar estos Términos; los cambios sustanciales se anunciarán por
email o en la aplicación con al menos 15 días de antelación, y seguir usando el
servicio tras su entrada en vigor supone su aceptación. Si no estás de acuerdo,
cancela antes de que se apliquen y te reembolsaremos el periodo prepagado no
disfrutado.</p>

<h2>18. Ley aplicable y disputas</h2>
<p>Estos Términos se rigen por la ley española, sin perjuicio de las normas
imperativas de protección de los consumidores de tu país de residencia. Las
disputas se someten a los juzgados y tribunales de Málaga, España — con la
salvedad de que, si eres consumidor, conservas el derecho a demandar y ser
demandado ante los tribunales de tu propio domicilio, y puedes acudir a los
sistemas de mediación y arbitraje de consumo de tu país de residencia. Vía de
reclamación: escribe primero a info@openshorts.app; la mayoría de los problemas
se resuelven en días.</p>
`

const PRIVACY_EN = `
<h2>1. Who is responsible</h2>
<p>The data controller is TONVI TECH SL (CIF B-19780394), Calle Puerta del Mar
18, 5th floor, 29005 Málaga, Spain — the company behind OpenShorts
(openshorts.app). For anything about your data, write to info@openshorts.app.
This policy is also available in <a href="/privacidad">Spanish</a>; for
residents of Spain, the Spanish version prevails in case of discrepancy.</p>

<h2>2. What we process, why, and on what legal basis</h2>
<h3>Your account</h3>
<p>Your email address (and, if you sign in with Google, your Google account
identifier), sign-up and last-login dates. We use passwordless magic links, so
we never store a password. Basis: performance of the contract (Art. 6.1.b
GDPR).</p>
<h3>Billing</h3>
<p>Payments run entirely on Stripe: we store your Stripe customer reference,
plan and subscription state, never your card number. Invoicing data is kept
because tax law requires it. Basis: contract (Art. 6.1.b) and legal obligation
(Art. 6.1.c).</p>
<h3>The videos you process</h3>
<p>The videos you upload or instruct us to fetch, their transcripts, and the
clips generated from them are processed to deliver exactly the job you
requested. Basis: contract (Art. 6.1.b). Where a video contains personal data
of other people (their image, their voice), you are the controller of that
data and we act as your processor on your instructions — see Section 6 of the
<a href="/terms">Terms of Service</a>.</p>
<h3>Your rights declaration</h3>
<p>Each time you submit a job you confirm you have the rights to the content.
We keep that declaration with its date, your IP address and browser
identifier, as evidence of diligence in case of copyright or image-rights
disputes. Basis: legitimate interest in establishing and defending legal
claims (Art. 6.1.f).</p>
<h3>Service emails</h3>
<p>We email you magic links, receipts, renewal reminders, clip-ready and
deletion warnings. These are part of the service, not marketing. Basis:
contract (Art. 6.1.b). If we ever send commercial newsletters, we will ask for
your consent first and every message will carry an unsubscribe link.</p>
<h3>Product analytics</h3>
<p>We run our own analytics (a self-hosted OpenPanel instance on our own
servers). No third-party trackers, no advertising pixels, no cross-site
tracking, and nothing is shared with anyone. Aggregate audience measurement is
exempt from consent under the Spanish supervisory authority's (AEPD) criteria;
usage events linked to your account (which features you use, whether jobs
succeed) are processed under our legitimate interest in improving and securing
the product (Art. 6.1.f) — you can object at any time by emailing
info@openshorts.app.</p>
<h3>Security and anti-abuse</h3>
<p>Server logs, IP-based rate limits and fraud signals, kept to protect the
service and its users. Basis: legitimate interest (Art. 6.1.f).</p>
<p>We do not process special categories of data (Art. 9 GDPR) as part of the
service, we make no automated decisions with legal effects on you (Art. 22
GDPR), and <strong>we do not use your content or your data to train AI models
— ours or anyone else's — nor sell it.</strong></p>

<h2>3. Cookies and local storage</h2>
<p>The site sets no third-party cookies and shows no cookie banner because it
does not need one: everything stored in your browser is strictly necessary to
provide what you asked for. Specifically: your session token (to keep you
signed in), your interface preferences (like your last-used editor settings),
and — if you use bring-your-own-key mode — your AI provider API keys, which
are stored encrypted in your own browser and are sent only to perform your
jobs, never stored on our servers. Our self-hosted, first-party audience
measurement operates under the AEPD's consent exemption for strictly
statistical analytics; identifiers live no longer than 13 months and raw data
no longer than 25 months.</p>

<h2>4. Who receives data (processors) and where</h2>
<p>We use a short list of providers, each bound by a data processing agreement,
and only for the purpose stated:</p>
<ul>
<li><strong>Google (Gemini API)</strong> — AI analysis of your video's
transcript and frames to select moments and layouts. Google's paid API terms
prohibit using customer data to train models. USA.</li>
<li><strong>ElevenLabs</strong> — AI dubbing, only when you request it. USA.</li>
<li><strong>Stripe</strong> — payments and invoicing. USA/EU.</li>
<li><strong>Cloudflare R2 and Amazon Web Services S3</strong> — storage of your
clips and project files. EU/USA regions.</li>
<li><strong>Hetzner and Contabo</strong> — the servers the service runs on.
Germany.</li>
<li><strong>Upload-Post</strong> — publishing to social accounts you connect,
only on your instruction. Operated by TONVI TECH SL under this same
policy.</li>
<li><strong>Namecheap Private Email</strong> — delivery of service emails.
USA.</li>
</ul>
<p>Where a provider processes data outside the European Economic Area, the
transfer relies on the EU–US Data Privacy Framework where the provider is
certified and, in any case, on the European Commission's Standard Contractual
Clauses (Art. 46.2.c GDPR) as a fallback, together with the provider's
technical safeguards. We prefer EU regions where the provider offers them.</p>

<h2>5. How long we keep things</h2>
<ul>
<li>Free-plan clips: 7 days, then permanently deleted (we warn you by email
first).</li>
<li>Paid-plan projects and clips: while your subscription is active, plus 7
days.</li>
<li>Account data: while your account exists; after deletion, only what is
needed to meet legal obligations or resolve disputes.</li>
<li>Invoicing data: 6 years (Spanish commercial law).</li>
<li>Rights declarations and related logs: up to 5 years, matching the statute
of limitations for civil claims.</li>
<li>Analytics identifiers: 13 months; raw analytics data: 25 months.</li>
</ul>

<h2>6. Your rights</h2>
<p>You can ask us for access, rectification, erasure, restriction, portability
of your data, and object to processing based on legitimate interest — just
email info@openshorts.app from your account address; we answer within one
month. You do not need to ask us to erase your account: <strong>Account →
Delete account</strong> in the dashboard does it yourself, immediately and
permanently, taking your projects, clips, transcripts, API keys and social
connections with it and cancelling any active subscription. Two things survive
it, both listed in section 5: your invoices, which tax law requires us to keep,
and a record that the deletion happened, which identifies you by a one-way hash
of your email address rather than by the address itself.
If you believe we are mishandling your data, you can complain to the Spanish
supervisory authority (AEPD, aepd.es) or to the authority of your own EU
country.</p>

<h2>7. Age</h2>
<p>The service is not directed at children. You must be at least 16, or the
age of digital consent in your country if higher, to create an account.</p>

<h2>8. Changes</h2>
<p>If we change this policy in any meaningful way we will tell you by email or
in-app before the change takes effect, and the date on this page always
reflects the current version.</p>
`

const PRIVACY_ES = `
<h2>1. Responsable del tratamiento</h2>
<p>El responsable es TONVI TECH SL (CIF B-19780394), Calle Puerta del Mar 18,
5ª planta, 29005 Málaga, España — la empresa detrás de OpenShorts
(openshorts.app). Para cualquier cuestión sobre tus datos, escribe a
info@openshorts.app. Esta política está también disponible en
<a href="/privacy">inglés</a>; para residentes en España prevalece la versión
en castellano en caso de discrepancia.</p>

<h2>2. Qué tratamos, para qué y con qué base jurídica</h2>
<h3>Tu cuenta</h3>
<p>Tu dirección de email (y, si inicias sesión con Google, tu identificador de
cuenta de Google), fechas de alta y de último acceso. Usamos enlaces mágicos
sin contraseña, así que nunca almacenamos una contraseña. Base: ejecución del
contrato (art. 6.1.b RGPD).</p>
<h3>Facturación</h3>
<p>Los pagos se realizan íntegramente en Stripe: guardamos tu referencia de
cliente de Stripe, el plan y el estado de la suscripción, nunca tu número de
tarjeta. Los datos de facturación se conservan porque la normativa fiscal lo
exige. Base: contrato (art. 6.1.b) y obligación legal (art. 6.1.c).</p>
<h3>Los vídeos que procesas</h3>
<p>Los vídeos que subes o nos ordenas descargar, sus transcripciones y los
clips generados a partir de ellos se tratan para prestarte exactamente el
trabajo que solicitaste. Base: contrato (art. 6.1.b). Cuando un vídeo contiene
datos personales de otras personas (su imagen, su voz), el responsable de esos
datos eres tú y nosotros actuamos como tu encargado siguiendo tus
instrucciones — ver cláusula 6 de los <a href="/terminos">Términos de
Servicio</a>.</p>
<h3>Tu declaración de derechos</h3>
<p>Cada vez que envías un trabajo confirmas que tienes derechos sobre el
contenido. Conservamos esa declaración con su fecha, tu dirección IP y el
identificador de tu navegador, como prueba de diligencia ante posibles
disputas de derechos de autor o de imagen. Base: interés legítimo en la
formulación y defensa de reclamaciones (art. 6.1.f).</p>
<h3>Emails de servicio</h3>
<p>Te enviamos enlaces de acceso, recibos, avisos de renovación, avisos de
clips listos y de eliminación. Forman parte del servicio, no son marketing.
Base: contrato (art. 6.1.b). Si algún día enviamos boletines comerciales, te
pediremos consentimiento antes y cada mensaje llevará enlace de baja.</p>
<h3>Analítica de producto</h3>
<p>Usamos nuestra propia analítica (una instancia autoalojada de OpenPanel en
nuestros propios servidores). Sin rastreadores de terceros, sin píxeles
publicitarios, sin seguimiento entre sitios, y sin compartir nada con nadie.
La medición de audiencia agregada está exenta de consentimiento según los
criterios de la AEPD; los eventos de uso vinculados a tu cuenta (qué funciones
usas, si los trabajos terminan bien) se tratan bajo nuestro interés legítimo en
mejorar y proteger el producto (art. 6.1.f) — puedes oponerte en cualquier
momento escribiendo a info@openshorts.app.</p>
<h3>Seguridad y antiabuso</h3>
<p>Registros del servidor, límites de uso por IP y señales de fraude,
conservados para proteger el servicio y a sus usuarios. Base: interés legítimo
(art. 6.1.f).</p>
<p>No tratamos categorías especiales de datos (art. 9 RGPD) como parte del
servicio, no tomamos decisiones automatizadas con efectos jurídicos sobre ti
(art. 22 RGPD) y <strong>no usamos tu contenido ni tus datos para entrenar
modelos de IA — ni nuestros ni de terceros — ni los vendemos.</strong></p>

<h2>3. Cookies y almacenamiento local</h2>
<p>El sitio no instala cookies de terceros y no muestra banner de cookies
porque no lo necesita: todo lo que se guarda en tu navegador es estrictamente
necesario para prestarte lo que pediste. En concreto: tu token de sesión (para
mantenerte identificado), tus preferencias de interfaz (como los últimos
ajustes del editor) y — si usas el modo con claves propias — tus claves API de
proveedores de IA, que se guardan cifradas en tu propio navegador y solo se
envían para ejecutar tus trabajos, nunca se almacenan en nuestros servidores.
Nuestra medición de audiencia propia y autoalojada opera bajo la exención de
consentimiento de la AEPD para analítica estrictamente estadística; los
identificadores no viven más de 13 meses y los datos brutos no más de 25.</p>

<h2>4. Quién recibe datos (encargados) y dónde</h2>
<p>Usamos una lista corta de proveedores, cada uno vinculado por un contrato de
encargo de tratamiento y solo para el fin indicado:</p>
<ul>
<li><strong>Google (API Gemini)</strong> — análisis con IA de la transcripción
y fotogramas de tu vídeo para seleccionar momentos y encuadres. Las
condiciones de la API de pago de Google prohíben usar los datos de clientes
para entrenar modelos. EE. UU.</li>
<li><strong>ElevenLabs</strong> — doblaje con IA, solo cuando lo solicitas.
EE. UU.</li>
<li><strong>Stripe</strong> — pagos y facturación. EE. UU./UE.</li>
<li><strong>Cloudflare R2 y Amazon Web Services S3</strong> — almacenamiento de
tus clips y archivos de proyecto. Regiones UE/EE. UU.</li>
<li><strong>Hetzner y Contabo</strong> — los servidores donde se ejecuta el
servicio. Alemania.</li>
<li><strong>Upload-Post</strong> — publicación en las cuentas sociales que
conectes, solo siguiendo tu instrucción. Operado por TONVI TECH SL bajo esta
misma política.</li>
<li><strong>Namecheap Private Email</strong> — entrega de los emails de
servicio. EE. UU.</li>
</ul>
<p>Cuando un proveedor trata datos fuera del Espacio Económico Europeo, la
transferencia se ampara en el Marco de Privacidad de Datos UE–EE. UU. si el
proveedor está certificado y, en todo caso, en las Cláusulas Contractuales
Tipo de la Comisión Europea (art. 46.2.c RGPD) como salvaguarda subsidiaria,
junto con las medidas técnicas del proveedor. Preferimos regiones de la UE
cuando el proveedor las ofrece.</p>

<h2>5. Cuánto tiempo conservamos cada cosa</h2>
<ul>
<li>Clips del plan gratuito: 7 días; después se eliminan de forma permanente
(te avisamos antes por email).</li>
<li>Proyectos y clips de planes de pago: mientras tu suscripción esté activa,
más 7 días.</li>
<li>Datos de cuenta: mientras exista tu cuenta; tras su eliminación, solo lo
necesario para cumplir obligaciones legales o resolver disputas.</li>
<li>Datos de facturación: 6 años (Código de Comercio).</li>
<li>Declaraciones de derechos y registros asociados: hasta 5 años, en línea
con el plazo de prescripción de las acciones civiles.</li>
<li>Identificadores de analítica: 13 meses; datos brutos de analítica: 25
meses.</li>
</ul>

<h2>6. Tus derechos</h2>
<p>Puedes pedirnos acceso, rectificación, supresión, limitación y portabilidad
de tus datos, y oponerte a los tratamientos basados en interés legítimo —
basta un email a info@openshorts.app desde la dirección de tu cuenta;
respondemos en el plazo de un mes. Para la supresión no necesitas pedírnosla:
<strong>Cuenta → Eliminar cuenta</strong> en el panel la ejecuta tú mismo, de
forma inmediata y permanente, y se lleva por delante tus proyectos, clips,
transcripciones, claves de API y conexiones con redes sociales, además de
cancelar cualquier suscripción activa. Solo sobreviven dos cosas, ambas
recogidas en el apartado 5: tus facturas, que la normativa fiscal nos obliga a
conservar, y un registro de que la eliminación se produjo, que te identifica
mediante un hash irreversible de tu dirección de email y no mediante la
dirección en sí. Si crees que tratamos mal tus datos, puedes reclamar
ante la Agencia Española de Protección de Datos (AEPD, aepd.es) o ante la
autoridad de tu país de la UE.</p>

<h2>7. Edad</h2>
<p>El servicio no está dirigido a menores. Para crear una cuenta debes tener al
menos 16 años, o la edad de consentimiento digital de tu país si es mayor.</p>

<h2>8. Cambios</h2>
<p>Si cambiamos esta política de forma relevante te lo comunicaremos por email
o en la aplicación antes de que el cambio surta efecto, y la fecha de esta
página refleja siempre la versión vigente.</p>
`

const LEGAL_EN = `
<h2>Site owner</h2>
<p>In compliance with Article 10 of Spanish Law 34/2002 (LSSI-CE), the owner of
openshorts.app is:</p>
<ul>
<li><strong>Company:</strong> TONVI TECH SL</li>
<li><strong>Tax ID (CIF):</strong> B-19780394</li>
<li><strong>Registered address:</strong> Calle Puerta del Mar 18, 5th floor,
29005 Málaga, Spain</li>
<li><strong>Registry:</strong> registered with the Mercantile Registry of
Málaga</li>
<li><strong>Contact:</strong> info@openshorts.app</li>
</ul>

<h2>Purpose of the site</h2>
<p>openshorts.app provides OpenShorts Cloud, an AI service that turns
long-form video into short vertical clips, under the <a href="/terms">Terms of
Service</a>. Personal data is handled as described in the
<a href="/privacy">Privacy Policy</a>. Prices shown on the pricing page
indicate whether taxes are included; where they are not, the applicable tax is
displayed at checkout before you pay.</p>

<h2>Intellectual property</h2>
<p>The OpenShorts source code is available under the MIT License in its public
repository. The openshorts.app site, its branding and its content are property
of TONVI TECH SL or its licensors. Videos and clips processed through the
service belong to their respective owners.</p>

<h2>Responsibility</h2>
<p>TONVI TECH SL acts as a hosting and processing provider for content
submitted by its users, within the liability regime of Articles 14–17 LSSI-CE
and Regulation (EU) 2022/2065 (DSA). Notices about allegedly unlawful content
can be sent to info@openshorts.app, which is our single point of contact for
users and authorities; see Section 9 of the <a href="/terms">Terms of
Service</a> for the procedure.</p>

<h2>Applicable law</h2>
<p>This legal notice is governed by Spanish law. It is also available in
<a href="/aviso-legal">Spanish</a>; for residents of Spain, the Spanish
version prevails.</p>
`

const LEGAL_ES = `
<h2>Titular del sitio</h2>
<p>En cumplimiento del artículo 10 de la Ley 34/2002 (LSSI-CE), el titular de
openshorts.app es:</p>
<ul>
<li><strong>Denominación social:</strong> TONVI TECH SL</li>
<li><strong>CIF:</strong> B-19780394</li>
<li><strong>Domicilio:</strong> Calle Puerta del Mar 18, 5ª planta, 29005
Málaga, España</li>
<li><strong>Registro:</strong> inscrita en el Registro Mercantil de Málaga</li>
<li><strong>Contacto:</strong> info@openshorts.app</li>
</ul>

<h2>Objeto del sitio</h2>
<p>openshorts.app presta OpenShorts Cloud, un servicio de IA que convierte
vídeo largo en clips verticales cortos, conforme a los
<a href="/terminos">Términos de Servicio</a>. Los datos personales se tratan
según la <a href="/privacidad">Política de Privacidad</a>. Los precios de la
página de precios indican si incluyen impuestos; cuando no los incluyen, el
impuesto aplicable se muestra en el proceso de pago antes de pagar.</p>

<h2>Propiedad intelectual</h2>
<p>El código fuente de OpenShorts está disponible bajo Licencia MIT en su
repositorio público. El sitio openshorts.app, su marca y sus contenidos son
propiedad de TONVI TECH SL o de sus licenciantes. Los vídeos y clips
procesados a través del servicio pertenecen a sus respectivos titulares.</p>

<h2>Responsabilidad</h2>
<p>TONVI TECH SL actúa como prestador de servicios de alojamiento y
procesamiento del contenido remitido por sus usuarios, dentro del régimen de
responsabilidad de los artículos 14 a 17 de la LSSI-CE y del Reglamento (UE)
2022/2065 (DSA). Los avisos sobre contenido presuntamente ilícito pueden
dirigirse a info@openshorts.app, nuestro punto único de contacto para usuarios
y autoridades; el procedimiento se describe en la cláusula 9 de los
<a href="/terminos">Términos de Servicio</a>.</p>

<h2>Ley aplicable</h2>
<p>Este aviso legal se rige por la ley española. Está también disponible en
<a href="/legal-notice">inglés</a>; para residentes en España prevalece la
versión en castellano.</p>
`

export function legalPages() {
  return [
    {
      path: '/terms',
      title: 'Terms of Service | OpenShorts',
      description:
        'The terms that govern OpenShorts Cloud: your content stays yours, no AI training on your videos, EU consumer rights, retention periods and acceptable use.',
      h1: 'Terms of Service',
      breadcrumb: [{ name: 'Terms of Service' }],
      published: PUBLISHED,
      updated: PUBLISHED,
      tldr: [
        'You own your videos and the clips we generate from them. We never use your content to train AI models.',
        'You must hold the rights to every video you upload or link, and you are the publisher of everything you post through the service.',
        'Subscriptions renew automatically until you cancel, which you can do anytime from your account. EU consumers keep their 14-day withdrawal right.',
      ],
      body: TERMS_EN,
    },
    {
      path: '/privacy',
      title: 'Privacy Policy | OpenShorts',
      description:
        'What OpenShorts stores (email, billing reference, the videos you process), for how long, which providers touch it, and your GDPR rights. No third-party trackers.',
      h1: 'Privacy Policy',
      breadcrumb: [{ name: 'Privacy Policy' }],
      published: PUBLISHED,
      updated: PUBLISHED,
      tldr: [
        'We store your email, your billing reference and the videos you process — nothing beyond what the service needs.',
        'No third-party trackers and no cookie banner: analytics is self-hosted and first-party, and BYOK API keys live encrypted in your own browser.',
        'Your content is never used to train AI models. Free-plan clips are deleted after 7 days.',
      ],
      body: PRIVACY_EN,
    },
    {
      path: '/legal-notice',
      title: 'Legal Notice | OpenShorts',
      description:
        'Legal identification of the operator of openshorts.app (TONVI TECH SL, Spain) as required by Spanish Law 34/2002 (LSSI-CE).',
      h1: 'Legal Notice',
      breadcrumb: [{ name: 'Legal Notice' }],
      published: PUBLISHED,
      updated: PUBLISHED,
      tldr: [
        'openshorts.app is operated by TONVI TECH SL, CIF B-19780394, Calle Puerta del Mar 18, 29005 Málaga, Spain — contact info@openshorts.app.',
      ],
      body: LEGAL_EN,
    },
    {
      path: '/terminos',
      title: 'Términos de Servicio | OpenShorts',
      description:
        'Los términos de OpenShorts Cloud: tu contenido sigue siendo tuyo, sin entrenamiento de IA con tus vídeos, derechos de los consumidores de la UE y plazos de conservación.',
      h1: 'Términos de Servicio',
      breadcrumb: [{ name: 'Términos de Servicio' }],
      published: PUBLISHED,
      updated: PUBLISHED,
      lang: 'es',
      tldr: [
        'Tus vídeos y los clips que generamos a partir de ellos son tuyos. Nunca usamos tu contenido para entrenar modelos de IA.',
        'Debes tener derechos sobre cada vídeo que subes o enlazas, y eres el editor de todo lo que publiques a través del servicio.',
        'Las suscripciones se renuevan automáticamente hasta que canceles, y puedes cancelar cuando quieras desde tu cuenta. Los consumidores de la UE conservan su derecho de desistimiento de 14 días.',
      ],
      body: TERMS_ES,
    },
    {
      path: '/privacidad',
      title: 'Política de Privacidad | OpenShorts',
      description:
        'Qué guarda OpenShorts (email, referencia de facturación, los vídeos que procesas), durante cuánto tiempo, qué proveedores intervienen y tus derechos RGPD. Sin rastreadores de terceros.',
      h1: 'Política de Privacidad',
      breadcrumb: [{ name: 'Política de Privacidad' }],
      published: PUBLISHED,
      updated: PUBLISHED,
      lang: 'es',
      tldr: [
        'Guardamos tu email, tu referencia de facturación y los vídeos que procesas — nada más de lo que el servicio necesita.',
        'Sin rastreadores de terceros y sin banner de cookies: la analítica es propia y autoalojada, y las claves BYOK viven cifradas en tu propio navegador.',
        'Tu contenido nunca se usa para entrenar modelos de IA. Los clips del plan gratuito se eliminan a los 7 días.',
      ],
      body: PRIVACY_ES,
    },
    {
      path: '/aviso-legal',
      title: 'Aviso Legal | OpenShorts',
      description:
        'Identificación legal del titular de openshorts.app (TONVI TECH SL, España) conforme al artículo 10 de la Ley 34/2002 (LSSI-CE).',
      h1: 'Aviso Legal',
      breadcrumb: [{ name: 'Aviso Legal' }],
      published: PUBLISHED,
      updated: PUBLISHED,
      lang: 'es',
      tldr: [
        'openshorts.app es un servicio de TONVI TECH SL, CIF B-19780394, Calle Puerta del Mar 18, 29005 Málaga, España — contacto info@openshorts.app.',
      ],
      body: LEGAL_ES,
    },
  ]
}
