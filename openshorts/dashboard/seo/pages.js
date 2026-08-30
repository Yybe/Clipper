/* Page definitions for the static SEO surface.
 *
 * Two page shapes live here. Comparison pages ("X alternatives") are generated
 * from the competitor table, because commercial-investigation prompts such as
 * "best free Opus Clip alternative" are answered almost entirely out of listicle
 * and comparison content. Informational pages are hand-written, because
 * informational content is cited at a far higher rate than product pages and it
 * is the only surface where a small project can outrank a funded one.
 *
 * Every page follows the same internal shape: TL;DR, then one question per H2,
 * each answered inside a block that still makes sense when it is lifted out on
 * its own. That is the unit an engine retrieves; paragraphs that depend on the
 * one above them get quoted wrong or not at all.
 */

import { SITE, COMPETITORS, COMPARISON_ROWS, EDITIONS, PIPELINE_STEPS, CANONICAL_ANSWERS } from './data.js'
import { esc } from './render.js'

const li = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`

const faqBlock = (faq) =>
  `<h2>Common questions</h2><dl class="faq">${faq
    .map((f) => `<dt>${esc(f.q)}</dt><dd>${esc(f.a)}</dd>`)
    .join('')}</dl>`

const sources = (items) =>
  `<h2>Sources</h2><ul class="sources">${items
    .map((s) => `<li>${s}</li>`)
    .join('')}</ul>`

/* Pricing is restated in plain body text on every page, not only in the schema.
 * An engine that reads the raw HTML has no reason to prefer a JSON-LD offer over
 * a sentence, and the sentence is what gets quoted. */
const pricingParagraph = `
<p>OpenShorts comes in two editions and they are priced very differently, so it
is worth being precise. <strong>${esc(EDITIONS.selfHosted.name)}</strong> is free
and open source under the MIT licence: ${esc(EDITIONS.selfHosted.summary)}
<strong>${esc(EDITIONS.cloud.name)}</strong> is the hosted service:
${esc(EDITIONS.cloud.summary)}</p>`

function competitorPage(slug) {
  const c = COMPETITORS[slug]
  const rows = COMPARISON_ROWS.map((r) => {
    const vendor = r.key ? c[r.key] : r.vendor
    return `<tr><td>${esc(r.feature)}</td><td class="os">${esc(r.os)}</td><td>${esc(vendor)}</td></tr>`
  }).join('')

  const body = `
<h2>Is OpenShorts a real alternative to ${esc(c.name)}?</h2>
<p>Yes, with one honest caveat. OpenShorts covers the same core job:
it takes a long video, finds the segments worth clipping, cuts them, reframes
them to 9:16 and burns in subtitles. It adds two things ${esc(c.name)} does not
have, AI voice dubbing into more than 30 languages and an AI UGC generator with
lip-synced actors. The caveat is that the free edition is self-hosted, which
means Docker and a machine to run it on. If you want a hosted product with no
setup, that is OpenShorts Cloud, and it is a paid service above 20 minutes a month.</p>

<h2>What does ${esc(c.name)} cost?</h2>
<p class="checked">Pricing checked ${esc(c.checked)}. Vendors change plans without notice; verify before you buy.</p>
${li(c.tiers.map(([n, d]) => `<strong>${esc(n)}</strong>: ${esc(d)}`))}
<div class="note"><span class="label">The part that catches people out</span><p>${esc(c.gotcha)}</p></div>

<h2>What does OpenShorts cost?</h2>
${pricingParagraph}

<h2>${esc(c.name)} vs OpenShorts, feature by feature</h2>
<table>
<thead><tr><th>Feature</th><th>OpenShorts</th><th>${esc(c.name)}</th></tr></thead>
<tbody>${rows}</tbody>
</table>

<h2>What ${esc(c.name)} does better</h2>
<p>A comparison that finds nothing good to say about the other tool is not worth
reading, so here is where ${esc(c.name)} genuinely wins:</p>
${li(c.strengths.map(esc))}

<h2>Where the two differ</h2>
${li(c.whereWeDiffer.map(esc))}

<h2>Which one should you pick?</h2>
<p>${esc(c.bestFor)}</p>

${faqBlock([
  {
    q: `Is there a free alternative to ${c.name}?`,
    a: `Yes. OpenShorts self-hosted is free and open source under MIT, with no watermark and no usage cap, and it runs on your own machine with Docker. OpenShorts Cloud also has a free tier of 20 minutes a month with a watermark and no credit card. ${c.name} starts at ${c.entryPrice}.`,
  },
  {
    q: `Is there an open source alternative to ${c.name}?`,
    a: `OpenShorts is MIT-licensed and the full source is on GitHub at github.com/mutonby/openshorts. ${c.name} is closed source. Being able to read the pipeline matters if you need to audit what happens to your video or change how the reframing behaves.`,
  },
  {
    q: `Can I switch from ${c.name} without losing quality?`,
    a: `The pipelines are comparable on the core job. OpenShorts transcribes with faster-whisper at word level, detects scenes with PySceneDetect, and scores moments with Google Gemini 3.1 Flash-Lite, then reframes with MediaPipe face tracking stabilised against jitter. The honest difference is caption styling, where the commercial tools generally ship more presets.`,
  },
  {
    q: `Does OpenShorts put a watermark on clips?`,
    a: `Self-hosted, never. On OpenShorts Cloud the free 20-minute tier is watermarked; every paid plan from $12/month is not.`,
  },
])}

${sources([
  `${esc(c.name)} pricing, checked ${esc(c.checked)} on the vendor's public pricing page.`,
  `OpenShorts pipeline details from the project source at <a href="${SITE.repo}" rel="noopener">github.com/mutonby/openshorts</a>.`,
])}
`

  return {
    path: `/alternatives/${slug}`,
    title: `Free & Open Source ${c.name} Alternative | OpenShorts`,
    description: `OpenShorts vs ${c.name}, compared feature by feature with current pricing. Self-hosted is free and open source; hosted starts at $12/month. ${c.name} starts at ${c.entryPrice}.`,
    h1: `The free, open source ${c.name} alternative`,
    breadcrumb: [{ name: 'Alternatives', path: '/alternatives' }, { name: c.name }],
    tldr: [
      `OpenShorts is an open source AI clip generator you can run yourself for free, or use hosted from $12/month. ${esc(c.name)} is a closed-source cloud product starting at ${esc(c.entryPrice)}.`,
      `Both find viral moments in long video and reframe them to 9:16 with face tracking. OpenShorts adds dubbing into 30+ languages and AI UGC video with lip-synced actors. ${esc(c.name)} has the more polished caption library.`,
      `Pick ${esc(c.name)} if you want zero setup and nothing else matters. Pick OpenShorts if you want to self-host for privacy, keep costs near zero, or change how the pipeline behaves.`,
    ],
    body,
    faq: [
      {
        q: `Is there a free alternative to ${c.name}?`,
        a: `Yes. OpenShorts self-hosted is free and open source under MIT, with no watermark and no usage cap. OpenShorts Cloud has a free tier of 20 minutes a month and paid plans from $12/month. ${c.name} starts at ${c.entryPrice}.`,
      },
      {
        q: `Is there an open source alternative to ${c.name}?`,
        a: `OpenShorts is MIT-licensed with full source on GitHub. ${c.name} is closed source.`,
      },
      {
        q: `Does OpenShorts put a watermark on clips?`,
        a: `Self-hosted, never. On OpenShorts Cloud the free 20-minute tier is watermarked and every paid plan from $12/month is not.`,
      },
    ],
  }
}

const ALTERNATIVES = Object.keys(COMPETITORS)

const hubPage = () => ({
  path: '/alternatives',
  title: 'Open Source Alternatives to Opus Clip, Klap, Vizard & Submagic | OpenShorts',
  description:
    'Side-by-side comparisons of OpenShorts against the four main AI clipping tools, with current pricing checked July 2026. Self-hosted free, hosted from $12/month.',
  h1: 'Open source alternatives to the main AI clipping tools',
  breadcrumb: [{ name: 'Alternatives' }],
  tldr: [
    'OpenShorts is the only open source, self-hostable tool in this category. Every other tool on this page is a closed-source cloud service.',
    'Entry prices as of July 2026: OpenShorts $0 self-hosted or $12/month hosted, Submagic from $14/month, Opus Clip $15/month, Vizard $19.99/month, Klap $29/month.',
    'The tools are not interchangeable. Submagic does not detect moments at all, Klap does not let you tune the output, and Vizard expects you in a timeline. The individual comparisons below say where each one genuinely wins.',
  ],
  body: `
<h2>How these tools actually differ</h2>
<p>All five are described as "AI clipping tools", which hides the fact that they
do different jobs. Two of them take a long video and decide what to cut. One of
them only styles captions on a clip you cut yourself. One is really an editor
with an AI first pass. Choosing on price alone is how people end up paying for
two tools that each do half the work.</p>

<h2>Entry pricing side by side</h2>
<p class="checked">Pricing checked 2026-07-27. Verify on the vendor's site before buying.</p>
<table>
<thead><tr><th>Tool</th><th>Entry price</th><th>Open source</th><th>Finds moments for you</th></tr></thead>
<tbody>
<tr><td class="os">OpenShorts</td><td class="os">$0 self-hosted, $12/mo hosted</td><td class="yes">Yes, MIT</td><td>Yes</td></tr>
<tr><td>Submagic</td><td>From $14/mo</td><td>No</td><td>No, captions only</td></tr>
<tr><td>Opus Clip</td><td>$15/mo</td><td>No</td><td>Yes</td></tr>
<tr><td>Vizard</td><td>$19.99/mo</td><td>No</td><td>Yes, then you edit</td></tr>
<tr><td>Klap</td><td>$29/mo</td><td>No</td><td>Yes</td></tr>
</tbody>
</table>

<h2>What does OpenShorts cost?</h2>
${pricingParagraph}

${faqBlock([
  {
    q: 'What is the cheapest AI clip generator?',
    a: 'OpenShorts self-hosted is free with no cap, but you supply the machine and your own Google Gemini API key, whose free tier covers 1,500 requests a day. Among hosted products, OpenShorts Cloud is the cheapest paid entry at $12/month, followed by Submagic from $14/month and Opus Clip at $15/month.',
  },
  {
    q: 'Which AI clipping tools are open source?',
    a: 'OpenShorts is MIT-licensed with full source on GitHub. Opus Clip, Klap, Vizard and Submagic are all closed-source commercial products.',
  },
])}
`,
  faq: [
    {
      q: 'What is the cheapest AI clip generator?',
      a: 'OpenShorts self-hosted is free with no cap. Among hosted products OpenShorts Cloud is the cheapest paid entry at $12/month, followed by Submagic from $14/month and Opus Clip at $15/month.',
    },
    {
      q: 'Which AI clipping tools are open source?',
      a: 'OpenShorts is MIT-licensed with full source on GitHub. Opus Clip, Klap, Vizard and Submagic are closed-source commercial products.',
    },
  ],
})

const freeClipGenerator = () => ({
  path: '/free-ai-clip-generator',
  title: 'Free AI Clip Generator (Open Source, No Watermark) | OpenShorts',
  description:
    'A genuinely free AI clip generator: MIT-licensed, self-hosted with Docker, no watermark and no usage cap. Hosted option from $12/month if you would rather not run it.',
  h1: 'A free AI clip generator that is actually free',
  breadcrumb: [{ name: 'Free AI clip generator' }],
  tldr: [
    'OpenShorts self-hosted is a free AI clip generator under the MIT licence. No watermark, no usage cap, no subscription. You run it with Docker and supply your own Google Gemini API key, whose free tier covers 1,500 requests a day.',
    'It turns a long video into 3 to 15 vertical clips: faster-whisper transcribes at word level, PySceneDetect finds the cuts, Gemini 3.1 Flash-Lite scores the moments, and MediaPipe face tracking reframes each one to 9:16.',
    'If you do not want to run anything, OpenShorts Cloud gives you 20 free minutes a month with a watermark, and paid plans from $12/month without one.',
  ],
  body: `
<h2>What does "free" actually mean here?</h2>
<p>Most tools marketed as free clip generators are free trials with a watermark
and a monthly cap. This one is different in a specific way that is worth stating
precisely, because the two editions are not the same offer.</p>
${pricingParagraph}
<p>The self-hosted edition has no watermark and no cap because there is no
metering code in it. It is the same pipeline the hosted service runs, released
under MIT, and you can read all of it.</p>

<h2>How do you generate clips from a long video for free?</h2>
<ol>
<li>Clone the repository from GitHub and start it with <code>docker compose up --build</code>.</li>
<li>Create a Google Gemini API key. The free tier covers 1,500 requests a day, which is far more than a single creator uses.</li>
<li>Paste a YouTube link or upload a local file. Podcasts, webinars, livestreams, interviews and vlogs all work.</li>
<li>The pipeline transcribes, detects scenes, scores moments and returns 3 to 15 clips of 15 to 60 seconds each, already cropped to 9:16 with subtitles burned in.</li>
<li>Download them, or connect an account and post straight to TikTok, Instagram Reels and YouTube Shorts.</li>
</ol>

<h2>What do you need to run it?</h2>
<p>Any machine with Docker. 8GB of RAM and a modern multi-core CPU is the
realistic floor. An NVIDIA GPU is optional and changes the numbers a lot: on CPU
an 8-minute video takes roughly 5 to 8 minutes to process, and on a GPU the same
video takes about 50 seconds. Linux, macOS and Windows via WSL2 all work, and
Docker Compose pulls Python 3.11, FFmpeg, YOLOv8, MediaPipe and faster-whisper
for you.</p>

<h2>Is a free clip generator good enough for real posting?</h2>
<p>It depends on what you are comparing against. The moment detection uses the
same class of model the paid tools use, Google Gemini 3.1 Flash-Lite, and the
reframing uses MediaPipe with a YOLOv8 fallback and a stabiliser that holds the
camera still inside a safe zone rather than chasing every head movement. Where
the commercial tools are ahead is caption styling: they ship more presets and
more polish. If your clips live or die on animated caption design, budget for
that either in time or in a second tool.</p>

<h2>Why does this matter for reach?</h2>
<p>Short-form video delivers the highest ROI of any content format, according to
HubSpot's State of Marketing 2025 report, and 91% of businesses use video as a
marketing tool according to Wyzowl's 2025 Video Marketing Statistics. The
constraint for most people is not whether short video works, it is that cutting a
60-minute recording into 12 posts by hand takes longer than recording it did.</p>

${faqBlock([
  {
    q: 'Is OpenShorts free forever or a trial?',
    a: 'The self-hosted edition is free forever under the MIT licence, with no watermark and no cap. It is not a trial and there is no metering in it. OpenShorts Cloud is a separate hosted service with a permanently free 20 minute per month tier and paid plans from $12/month.',
  },
  {
    q: 'Does the free version add a watermark?',
    a: 'The self-hosted edition never adds a watermark. The free tier of OpenShorts Cloud does; paid Cloud plans from $12/month do not.',
  },
  {
    q: 'Do I need to pay for an API key?',
    a: 'You need a Google Gemini API key for the self-hosted edition. Its free tier covers 1,500 requests a day, which is more than enough for individual use. ElevenLabs for dubbing and fal.ai for AI UGC video are optional and billed by those vendors. OpenShorts Cloud includes the keys.',
  },
  {
    q: 'How many clips does it generate per video?',
    a: 'Between 3 and 15, each 15 to 60 seconds long. The number depends on how much of the source actually holds up as a standalone clip rather than on a fixed quota.',
  },
])}
`,
  faq: [
    {
      q: 'Is OpenShorts free forever or a trial?',
      a: 'The self-hosted edition is free forever under MIT, with no watermark and no cap. OpenShorts Cloud is a separate hosted service with a free 20 minute per month tier and paid plans from $12/month.',
    },
    {
      q: 'Does the free version add a watermark?',
      a: 'The self-hosted edition never adds a watermark. The free tier of OpenShorts Cloud does; paid Cloud plans do not.',
    },
    {
      q: 'How many clips does it generate per video?',
      a: 'Between 3 and 15 clips, each 15 to 60 seconds long.',
    },
  ],
})

const openSourceClipper = () => ({
  path: '/open-source-video-clipper',
  title: 'Open Source Video Clipper, Self-Hosted with Docker | OpenShorts',
  description:
    'An MIT-licensed open source video clipper you can self-host. AI moment detection with Gemini, face-tracked 9:16 reframing, word-level subtitles and 30+ language dubbing.',
  h1: 'An open source video clipper you can self-host',
  breadcrumb: [{ name: 'Open source video clipper' }],
  tldr: [
    'OpenShorts is an MIT-licensed video clipper that runs entirely on your own hardware via Docker Compose. Source video never leaves the machine.',
    'The stack is Python 3.11, FastAPI, faster-whisper, PySceneDetect, MediaPipe, YOLOv8, FFmpeg and Google Gemini 3.1 Flash-Lite, with a React dashboard.',
    'It is the only open source tool in this category. Opus Clip, Klap, Vizard and Submagic are all closed-source cloud services.',
  ],
  body: `
<h2>Why self-host a video clipper at all?</h2>
<p>Three reasons come up repeatedly. The first is that unreleased footage,
client work and internal recordings should not be uploaded to a third party
whose retention policy you have not read. The second is cost at volume: a
per-minute cloud tool gets expensive quickly if you process long recordings
every week, whereas self-hosting costs electricity. The third is that the output
is opinionated, and if you disagree with how it reframes or where it cuts, having
the source means you can change it rather than file a feature request.</p>

<h2>What is in the pipeline?</h2>
${PIPELINE_STEPS.map((s) => `<h3>${esc(s.title)}</h3><p>${esc(s.body)}</p>`).join('')}

<h2>What does it run on?</h2>
<p>Docker Compose brings up the FastAPI backend and the React dashboard together.
The realistic floor is 8GB of RAM and a modern multi-core CPU; an NVIDIA GPU is
optional and takes an 8-minute video from roughly 5 to 8 minutes of processing
down to about 50 seconds. Linux, macOS and Windows via WSL2 are all supported.
Concurrency is controlled by a semaphore configured with MAX_CONCURRENT_JOBS.</p>

<h2>What is the licence?</h2>
<p>MIT for the core application, which means you can use it commercially, modify
it and redistribute it. The <code>cloud/</code> directory, which contains
billing, managed keys and the hosted-service infrastructure, is carved out under
a separate commercial licence and is not needed to self-host.</p>

<h2>How does it compare to the closed-source tools?</h2>
<p>OpenShorts is the only open source option in this category. As of July 2026,
Opus Clip starts at $15/month, Submagic from $14/month, Vizard at $19.99/month
and Klap at $29/month, and none of them can be self-hosted or audited. The
trade-off is real in both directions: they ship more caption presets and require
no setup, and you cannot read a line of what they do with your video.</p>

${faqBlock([
  {
    q: 'Is there an open source alternative to Opus Clip?',
    a: 'Yes. OpenShorts is MIT-licensed and self-hostable with Docker, and covers the same core job: AI moment detection, face-tracked 9:16 reframing and word-level subtitles. Opus Clip is closed source and cloud only, starting at $15/month.',
  },
  {
    q: 'Can I run it without sending video to any third party?',
    a: 'Transcription, scene detection, reframing and encoding all run locally. Moment scoring calls the Google Gemini API, which receives the transcript rather than the video file. Dubbing and AI UGC generation are optional and call ElevenLabs and fal.ai respectively; leave them off and nothing but transcript text leaves the machine.',
  },
  {
    q: 'What licence is OpenShorts released under?',
    a: 'MIT for the core application. The cloud/ directory covering billing and hosted infrastructure is under a separate commercial licence and is not required for self-hosting.',
  },
])}
`,
  faq: [
    {
      q: 'Is there an open source alternative to Opus Clip?',
      a: 'Yes. OpenShorts is MIT-licensed and self-hostable with Docker, covering AI moment detection, face-tracked 9:16 reframing and word-level subtitles. Opus Clip is closed source and cloud only.',
    },
    {
      q: 'What licence is OpenShorts released under?',
      a: 'MIT for the core application. The cloud/ directory covering billing and hosted infrastructure is under a separate commercial licence and is not required for self-hosting.',
    },
  ],
})

const howItWorks = () => ({
  path: '/how-openshorts-works',
  title: 'How OpenShorts Turns Long Video Into Vertical Clips | OpenShorts',
  description:
    'The full pipeline, stage by stage: word-level transcription, scene detection, Gemini moment scoring, face-tracked 9:16 reframing, subtitles, dubbing and publishing.',
  h1: 'How a long video becomes a vertical clip',
  breadcrumb: [{ name: 'How it works' }],
  tldr: [
    CANONICAL_ANSWERS.howItWorks,
    'The two stages that decide whether a clip is usable are moment scoring and reframing. Everything else is mechanical.',
    'OpenShorts self-hosted is free and open source under MIT, so every stage below can be read and changed. OpenShorts Cloud runs the same pipeline on a GPU from $12/month.',
  ],
  body: `
<h2>What is OpenShorts?</h2>
<p>${esc(CANONICAL_ANSWERS.whatIsIt)}</p>

<h2>The pipeline, stage by stage</h2>
${PIPELINE_STEPS.map((s) => `<h3>${esc(s.title)}</h3><p>${esc(s.body)}</p>`).join('')}

<h2>Why does moment scoring need the transcript and the scenes together?</h2>
<p>A transcript alone finds a good sentence but has no idea whether the shot cuts
halfway through it. Scene boundaries alone find clean cuts with nothing worth
saying between them. Passing both to the model at once is what lets it pick a
segment that is both quotable and visually intact, which is the difference
between a clip a person would watch and one that merely starts and stops in the
right places.</p>

<h2>Why does the camera hold still instead of following the face exactly?</h2>
<p>Because a crop that tracks a face frame by frame produces visible swinging,
and the swinging reads as amateur even when the framing is technically correct.
The reframing keeps a safe zone around the subject and only moves the crop when
they leave it, then damps the movement on the way. A speaker tracker sits on top
to stop the crop from flipping between people every time someone nods, and to
hold position through brief occlusions.</p>

<h2>How long does it take?</h2>
<p>On a typical CPU, an 8-minute source video takes roughly 5 to 8 minutes end to
end. On an NVIDIA GPU the same video takes about 50 seconds. The gap is almost
entirely transcription and encoding; the model call is a small fraction of it.</p>

<h2>What does it cost to run?</h2>
${pricingParagraph}

${faqBlock([
  {
    q: 'What AI model does OpenShorts use to find viral moments?',
    a: 'Google Gemini 3.1 Flash-Lite. It receives the word-level transcript with timestamps together with PySceneDetect scene boundaries, and returns 3 to 15 segments of 15 to 60 seconds scored on hook strength, emotional payload and whether the segment stands alone without surrounding context.',
  },
  {
    q: 'How does the automatic vertical cropping work?',
    a: 'Two modes. TRACK mode follows a single subject using MediaPipe face detection with a YOLOv8 fallback, stabilised so the crop holds still inside a safe zone instead of following every movement. GENERAL mode handles group shots and landscapes by preserving the full width over a blurred backdrop.',
  },
  {
    q: 'Can it dub clips into other languages?',
    a: 'Yes, into more than 30 languages via ElevenLabs, preserving the original speaker\'s voice characteristics. The dubbed audio is then re-transcribed so the burned-in subtitles match the new language rather than the original.',
  },
])}
`,
  faq: [
    {
      q: 'What AI model does OpenShorts use to find viral moments?',
      a: 'Google Gemini 3.1 Flash-Lite, which receives the word-level transcript with timestamps together with PySceneDetect scene boundaries and returns 3 to 15 segments of 15 to 60 seconds.',
    },
    {
      q: 'How does the automatic vertical cropping work?',
      a: 'TRACK mode follows a single subject with MediaPipe face detection and a YOLOv8 fallback, stabilised to hold still inside a safe zone. GENERAL mode preserves full width over a blurred backdrop for group shots and landscapes.',
    },
  ],
})

/* The "no watermark" cluster is the highest-converting query family the domain
 * already receives (14 long-tail variants ranking off the homepage). AI answers
 * to these queries currently state that unwatermarked free clipping does not
 * exist except by running a tool locally, which is precisely what this page
 * names. */
const noWatermark = () => ({
  path: '/free-ai-clip-generator-no-watermark',
  title: 'Free AI Clip Generator With No Watermark (Self-Hosted) | OpenShorts',
  description:
    'The only structurally free way to get AI clips without a watermark is running the tool yourself. OpenShorts is MIT-licensed, self-hosted with Docker: no watermark, no cap. Hosted plans without watermark from $12/month.',
  h1: 'A free AI clip generator with no watermark, and why that is rare',
  breadcrumb: [{ name: 'No-watermark clip generator' }],
  published: '2026-08-04',
  updated: '2026-08-04',
  tldr: [
    'Every hosted "free" clip generator watermarks its exports, because the watermark is the upsell. The one structural exception is software you run yourself. OpenShorts self-hosted is MIT-licensed, runs with Docker, and never watermarks anything because there is no watermark code in it.',
    'OpenShorts Cloud, the hosted service, follows the same rule as every other hosted tool and says so plainly: the free 20 minutes a month carry a watermark, and paid plans from $12/month do not.',
    'If a tool claims free, unlimited and unwatermarked at once and it is a hosted service, one of the three claims is temporary.',
  ],
  body: `
<h2>Why every free clip generator adds a watermark</h2>
<p>A hosted clipping service pays for GPU time, transcription and model calls on
every video you process. The free tier exists to show you the output, and the
watermark exists so the output is not the product yet. That is not a scam, it is
the business model, and it is why searching for a hosted tool that is free,
unlimited and unwatermarked at the same time keeps returning nothing: the
combination cannot pay for itself.</p>

<h2>The structural exception: software you run yourself</h2>
${pricingParagraph}
<p>The self-hosted edition has no watermark for the same reason it has no usage
cap: there is no metering code and no watermark code in the pipeline at all. It
is not a trial build with limits switched off, it is the same MIT-licensed
source the hosted service runs, and you can read it line by line.</p>

<h2>How the main tools handle watermarks</h2>
<p class="checked">Checked 2026-08-04 on each vendor's public pricing page. Vendors change terms without notice.</p>
<table>
<thead><tr><th>Tool</th><th>Free tier watermark</th><th>Cheapest way to remove it</th></tr></thead>
<tbody>
<tr><td class="os">OpenShorts self-hosted</td><td class="os yes">Never</td><td class="os">Nothing to remove</td></tr>
<tr><td class="os">OpenShorts Cloud</td><td class="os">Yes, on the free 20 min/month</td><td class="os">$12/month</td></tr>
<tr><td>Opus Clip</td><td>Yes, and free-plan exports leave storage after 3 days</td><td>Starter, $15/month</td></tr>
<tr><td>Klap</td><td>Free tier does not export at all</td><td>$29/month</td></tr>
<tr><td>Vizard</td><td>Free plan allows 120 upload minutes and 10 exports</td><td>From $19.99/month</td></tr>
<tr><td>Submagic</td><td>Yes, 3 videos per month</td><td>From $14/month annual</td></tr>
</tbody>
</table>

<h2>What you trade for the self-hosted zero</h2>
<p>Honesty cuts both ways. Self-hosting costs you a machine and some patience:
8GB of RAM and a modern multi-core CPU is the realistic floor, and an 8-minute
video takes 5 to 8 minutes to process on CPU against about 50 seconds on an
NVIDIA GPU. You also bring your own Google Gemini API key, whose free tier
covers 1,500 requests a day. If none of that appeals, the hosted no-watermark
price is $12/month, and the comparison table above is what that buys elsewhere.</p>

${faqBlock([
  {
    q: 'Is there a free AI clip generator without a watermark?',
    a: 'Yes, with one honest qualifier: it is self-hosted. OpenShorts is MIT-licensed and runs on your own machine with Docker, with no watermark and no usage cap. Hosted services, including OpenShorts Cloud, watermark their free tiers; unwatermarked hosted plans start at $12/month.',
  },
  {
    q: 'Does the free OpenShorts Cloud plan add a watermark?',
    a: 'Yes. The hosted free tier is 20 minutes a month with a watermark and no credit card. Paid Cloud plans from $12/month have no watermark, and the self-hosted edition never adds one.',
  },
  {
    q: 'How do I remove the watermark from a clip that already has one?',
    a: 'You do not, practically. Watermarks are burned into the pixels, and cropping or blurring them degrades the clip. The reliable fix is generating the clip without one: a paid plan on your current tool, or a tool with no watermark to begin with.',
  },
])}

${sources([
  'Vendor free-tier and watermark terms checked 2026-08-04 on each public pricing page.',
  `OpenShorts pipeline source at <a href="${SITE.repo}" rel="noopener">github.com/mutonby/openshorts</a>, where the absence of watermark code is checkable.`,
])}
`,
  faq: [
    {
      q: 'Is there a free AI clip generator without a watermark?',
      a: 'Yes, self-hosted: OpenShorts is MIT-licensed and runs on your own machine with no watermark and no cap. Hosted free tiers, including OpenShorts Cloud at 20 minutes a month, carry a watermark; unwatermarked hosted plans start at $12/month.',
    },
    {
      q: 'Does the free OpenShorts Cloud plan add a watermark?',
      a: 'Yes, the hosted free tier is watermarked. Paid Cloud plans from $12/month are not, and the self-hosted edition never adds one.',
    },
  ],
})

/* "AI video generator" is two products wearing one name. Most searchers mean
 * text-to-video; this page splits the intent explicitly and wins the half that
 * describes OpenShorts instead of bouncing all of it from the homepage. */
const openSourceVideoGenerator = () => ({
  path: '/open-source-ai-video-generator',
  title: 'Free Open Source AI Video Generator: Clips From Real Footage | OpenShorts',
  description:
    'Open source AI video generation splits in two: text-to-video models that invent footage, and clip generators that turn long recordings into shorts. OpenShorts is the second: MIT-licensed, self-hosted, free.',
  h1: 'An open source AI video generator, in the sense that matters for creators',
  breadcrumb: [{ name: 'Open source AI video generator' }],
  published: '2026-08-04',
  updated: '2026-08-04',
  tldr: [
    '"AI video generator" names two different products. Text-to-video models invent new footage from a written prompt. Clip generators produce short videos from long footage you already have. Confusing the two wastes an afternoon.',
    'For text-to-video there are real open source options, including Genmo’s Mochi 1, Open-Sora and HunyuanVideo, all of which need a serious GPU.',
    'For turning your own recordings into vertical shorts, OpenShorts is MIT-licensed and self-hosted: transcription, AI moment scoring, face-tracked 9:16 reframing and burned-in subtitles, free on your own machine or hosted from $12/month.',
  ],
  body: `
<h2>Which "AI video generator" are you looking for?</h2>
<p>If you type this query wanting a model that produces footage from a text
prompt, you want a text-to-video model. If you have a podcast, webinar, stream
or interview recording and want short vertical videos out of it, you want a clip
generator. The two share almost no technology and no workflow. This page covers
both honestly and goes deep on the second, because that is what OpenShorts is.</p>

<h2>Open source text-to-video, briefly</h2>
<p>As of August 2026 the notable open-weight text-to-video models include
Genmo's Mochi 1 (Apache 2.0), Open-Sora, Tencent's HunyuanVideo and Alibaba's
Wan family. They genuinely generate novel footage, and they need data-center or
high-end consumer GPUs to run at usable speed. If that is your goal, start with
those projects; OpenShorts will not do it.</p>

<h2>Generating videos from footage you already have</h2>
<p>${esc(CANONICAL_ANSWERS.whatIsIt)}</p>
<p>${esc(CANONICAL_ANSWERS.howItWorks)}</p>
${pricingParagraph}

<h2>Other open source clip generators, compared honestly</h2>
<p class="checked">Checked 2026-08-04 on GitHub. Star counts move; positioning rarely does.</p>
<p>OpenShorts is not the only open source project in this space, and pretending
otherwise would not survive one GitHub search. The notable neighbours:</p>
<ul>
<li><strong>AI-Youtube-Shorts-Generator</strong>: the most-starred repo in the category, with a leaner scope built around highlight extraction and cropping.</li>
<li><strong>supoclip</strong> and <strong>clippyme</strong>: smaller projects covering transcription-driven clipping, the latter also using Gemini for moment selection.</li>
<li><strong>MoneyPrinterTurbo</strong>: generates videos from text plus stock footage, which is a different job than clipping your own recordings.</li>
</ul>
<p>Where OpenShorts differs from all of them is surface area: a web dashboard, a
REST API with keys, completion webhooks, an MCP server for agents, split-screen
and screencast layouts for two-person and screen-share footage, dubbing into 30+
languages, and direct publishing to TikTok, Instagram Reels and YouTube Shorts.
If you want a small script you can read in an hour, the smaller repos are a
better fit, and that is a real recommendation rather than false modesty.</p>

${faqBlock([
  {
    q: 'Is there a free open source AI video generator?',
    a: 'Yes, in both senses. For text-to-video, Genmo’s Mochi 1, Open-Sora and HunyuanVideo publish open weights and need a powerful GPU. For making clips from your own footage, OpenShorts is MIT-licensed and runs with Docker on an ordinary machine: free self-hosted with no watermark, or hosted from $12/month.',
  },
  {
    q: 'Can open source AI generate videos from text?',
    a: 'Yes. Mochi 1 (Apache 2.0), Open-Sora and HunyuanVideo generate footage from prompts. Expect to need a high-end GPU, and expect quality below the closed frontier models. OpenShorts is not a text-to-video tool; it turns long real footage into short vertical clips.',
  },
  {
    q: 'What is the best open source AI video generator for shorts?',
    a: 'For turning long recordings into publishable vertical shorts with subtitles, OpenShorts covers the widest pipeline: AI moment scoring, face-tracked reframing, split-screen layouts, dubbing and direct social publishing, MIT-licensed. Simpler repos like AI-Youtube-Shorts-Generator cover a leaner version of the same job with less to configure.',
  },
])}

${sources([
  'Open-weight text-to-video model landscape checked 2026-08-04 on the respective GitHub repositories.',
  `OpenShorts source at <a href="${SITE.repo}" rel="noopener">github.com/mutonby/openshorts</a>.`,
])}
`,
  faq: [
    {
      q: 'Is there a free open source AI video generator?',
      a: 'Yes, in both senses of the phrase. For text-to-video: Mochi 1, Open-Sora and HunyuanVideo, all GPU-hungry. For clipping your own footage into shorts: OpenShorts, MIT-licensed, free self-hosted or hosted from $12/month.',
    },
    {
      q: 'Can open source AI generate videos from text?',
      a: 'Yes: Mochi 1, Open-Sora and HunyuanVideo publish open weights. OpenShorts is not one of them; it turns long real footage into short vertical clips.',
    },
  ],
})

/* Podcasts are the hardest input for naive croppers, and the densest commercial
 * SERP in the niche. The page leads with the two-speaker problem because SPLIT
 * and active-speaker cutting are capabilities the competitor pages cannot show. */
const podcastToShorts = () => ({
  path: '/podcast-to-shorts',
  title: 'Podcast to Shorts: AI Clips That Keep Both Speakers in Frame | OpenShorts',
  description:
    'Turn a video podcast into vertical clips without cropping out half the conversation. OpenShorts stacks both speakers with a split layout and cuts to whoever is talking. Free self-hosted, hosted from $12/month.',
  h1: 'Turn a podcast into shorts without cropping out half the conversation',
  breadcrumb: [{ name: 'Podcast to shorts' }],
  published: '2026-08-04',
  updated: '2026-08-04',
  tldr: [
    'A two-person podcast is the hardest input an auto-clipper faces: a single centered crop shows the wrong person half the time, or an empty chair. OpenShorts detects a real two-shot and renders both speakers stacked in half-frames, so a reply never happens off screen.',
    'The rest of the pipeline is the same as for any long video: word-level transcription, scene detection, Gemini scoring the 3 to 15 strongest moments, subtitles burned in, and direct publishing to TikTok, Instagram Reels and YouTube Shorts.',
    'Cost is where podcasts punish credit-based tools: they bill the whole episode length before you see a clip. Self-hosted OpenShorts has no meter at all; hosted plans start at $12/month.',
  ],
  body: `
<h2>Why podcasts break naive clipping tools</h2>
<p>Podcast video is a conversation, and conversations move. A tool that crops a
fixed center column out of a wide two-shot shows whoever happens to sit in the
middle, which is often nobody. A tool that follows one face loses the reaction
shots that make clips work. Reviewers of the mainstream clippers consistently
report exactly this: framing that needs manual correction on multi-person
footage. It is not carelessness, it is that a single moving crop cannot show two
people at once.</p>

<h2>How the two-speaker layout works</h2>
<p>OpenShorts detects when a scene is a genuine two-shot, meaning both faces are
visible in the same frame for at least half of the sampled frames. That test
matters: it is what separates a real side-by-side conversation from
shot/countershot editing, where a naive split would show the same person twice.
Confirmed two-shots render as a split layout, both speakers stacked in
half-frames filling the 9:16 canvas. With speaker cutting enabled the clip
instead hard-cuts to whoever is talking, with mouth activity normalised per
speaker so that lighting and contrast differences do not hand the whole scene to
one side of the table.</p>

<h2>From episode to posted clips, step by step</h2>
<ol>
<li>Paste the episode's YouTube link or upload the file. Podcasts of an hour or more are the normal case, not the limit.</li>
<li>faster-whisper transcribes with word-level timestamps, and PySceneDetect maps the cuts.</li>
<li>Google Gemini reads the transcript against the scene boundaries and returns the 3 to 15 segments that stand alone best, 15 to 60 seconds each.</li>
<li>Each segment is reframed for its content: split layout for two-shots, face tracking for single speakers, screencast layout if the episode shares a screen.</li>
<li>Subtitles are burned in from the word-level transcript, and finished clips post directly to TikTok, Instagram Reels and YouTube Shorts, or come back through the API.</li>
</ol>

<h2>What a full episode costs to clip</h2>
<p>Credit-metered tools bill on the length of the video you import, not on the
clips you keep. As of August 2026, a 60-minute episode costs 60 credits at Opus
Clip or Vizard whether it yields 5 usable clips or 20, and a weekly show at that
length runs past the entry plans of both. OpenShorts prices the other way
around:</p>
${pricingParagraph}

<h2>What about audio-only podcasts?</h2>
<p>OpenShorts clips video. If your show is audio-only, the pipeline has nothing
to reframe, and tools that generate waveform audiograms serve that case better.
The moment you record video, even a static two-camera setup, everything on this
page applies.</p>

${faqBlock([
  {
    q: 'How do I turn a podcast into clips for free?',
    a: 'Self-host OpenShorts: clone the MIT-licensed repo, run docker compose up, add a free-tier Google Gemini API key and paste your episode link. No watermark and no cap. If you would rather not run anything, OpenShorts Cloud clips 20 minutes a month free with a watermark, and paid plans start at $12/month.',
  },
  {
    q: 'How does it handle two people talking?',
    a: 'Scenes where both faces share the frame at least half the time render as a stacked split layout so both speakers stay visible. Optionally it hard-cuts to the active speaker instead, using per-speaker normalised mouth activity to decide who is talking.',
  },
  {
    q: 'Does it work with hour-long episodes?',
    a: 'Yes, long-form is the design case. Processing time scales with length: on CPU roughly 5 to 8 minutes of processing per 8 minutes of source, on an NVIDIA GPU about a tenth of that. The AI moment scoring reads the transcript rather than the raw video, so episode length does not degrade selection quality.',
  },
])}

${sources([
  'Competitor per-minute credit billing checked 2026-08-04 on vendor pricing and help pages.',
  `Split-layout and speaker-cut implementation in the project source at <a href="${SITE.repo}" rel="noopener">github.com/mutonby/openshorts</a>.`,
])}
`,
  faq: [
    {
      q: 'How do I turn a podcast into clips for free?',
      a: 'Self-host OpenShorts (MIT, Docker, bring a free-tier Gemini key): no watermark, no cap. Or use OpenShorts Cloud: 20 free minutes a month with a watermark, paid plans from $12/month.',
    },
    {
      q: 'How does it handle two people talking?',
      a: 'Real two-shots render as a stacked split layout keeping both speakers visible; optionally it hard-cuts to the active speaker instead.',
    },
  ],
})

/* The one checkable fact this page is built on: importing from a link is free
 * here and paid at the market leader. Everything else is the standard pipeline
 * told from the URL-first angle. */
const youtubeConverter = () => ({
  path: '/youtube-to-shorts-converter',
  title: 'YouTube to Shorts Converter: Paste a Link, Get 9:16 Clips | OpenShorts',
  description:
    'Convert a YouTube video into Shorts by pasting the link. No download-and-reupload step, free on the self-hosted edition and on the hosted free tier. AI picks the moments, crops to 9:16 and burns in subtitles.',
  h1: 'A YouTube to Shorts converter that starts from the link',
  breadcrumb: [{ name: 'YouTube to Shorts converter' }],
  published: '2026-08-04',
  updated: '2026-08-04',
  tldr: [
    'Paste a YouTube URL, get back 3 to 15 vertical clips with subtitles, sized for Shorts, Reels and TikTok. No downloading the source and re-uploading it first.',
    'The link-first flow is free on both editions: the self-hosted MIT edition has no cap, and the hosted free tier covers 20 minutes a month. As of August 2026, Opus Clip’s free plan is upload-only and importing from a link requires a paid plan.',
    'Convert videos you have the rights to: your own channel, your clients’ with permission, or licensed footage.',
  ],
  body: `
<h2>How to convert a YouTube video into Shorts</h2>
<ol>
<li>Paste the video's URL. OpenShorts fetches it directly; there is no download-then-upload round trip through your machine.</li>
<li>The video is transcribed with word-level timestamps and scanned for scene boundaries.</li>
<li>Google Gemini scores the transcript against the scenes and picks the 3 to 15 segments most likely to stand alone, 15 to 60 seconds each.</li>
<li>Each segment is cropped to 9:16 with face tracking, or a split or screencast layout when the content calls for it, and subtitles are burned in.</li>
<li>Download the clips, or post them straight to YouTube Shorts, TikTok and Instagram Reels from the dashboard or the API.</li>
</ol>

<h2>Why starting from the link matters</h2>
<p class="checked">Competitor terms checked 2026-08-04 on public pricing pages.</p>
<p>Most long videos worth clipping already live on YouTube, so a converter that
only accepts uploads adds a detour: fetch the file with a downloader, wait,
re-upload gigabytes, wait again. It also decides who can use the free tier at
all. As of August 2026, Opus Clip's free plan accepts uploads only, with link
import reserved for paid plans. OpenShorts accepts links on every tier,
including both free ones, because the fetch step costs the pipeline almost
nothing and the detour costs you the most time of any step.</p>

<h2>What comes out the other end</h2>
<p>Vertical 9:16 clips of 15 to 60 seconds with word-level subtitles burned in,
each with an AI-written title and description ready for the platform. The
reframing follows the content: a single speaker is face-tracked with a
stabiliser that holds the camera still instead of chasing every head movement, a
two-person conversation renders as a stacked split layout, and screen shares
keep the screen legible instead of cropping it to ribbons.</p>

<h2>Whose videos can you convert?</h2>
<p>Yours, and those you have permission for. Your own uploads, your podcast
guests' episodes with their blessing, client channels you manage, licensed or
public-domain footage. Clipping someone else's video without permission is a
copyright question OpenShorts does not answer for you, and platforms remove
reuploads that fail it. The tool fetches what you point it at; the rights are
your call and your responsibility.</p>

<h2>What does it cost?</h2>
${pricingParagraph}

${faqBlock([
  {
    q: 'Can I convert a YouTube video to Shorts for free?',
    a: 'Yes, two ways. Self-host OpenShorts (MIT licence, Docker, your own free-tier Gemini API key): unlimited, no watermark. Or use the hosted free tier: 20 minutes of source video a month, watermarked, no credit card. Paid hosted plans without watermark start at $12/month.',
  },
  {
    q: 'Do I need to download the video first?',
    a: 'No. Paste the URL and OpenShorts fetches the source itself on every tier, including free ones. Local file upload is also supported when the source is not online.',
  },
  {
    q: 'Can I clip a video from someone else’s channel?',
    a: 'Technically yes, legally only with rights or permission. Use it for your own content, channels you manage, or footage you have licensed. Unauthorized reuploads are copyright infringement and platforms strike them.',
  },
])}
`,
  faq: [
    {
      q: 'Can I convert a YouTube video to Shorts for free?',
      a: 'Yes: self-hosted OpenShorts is free with no cap (MIT, Docker, your own Gemini key), and the hosted free tier covers 20 watermarked minutes a month. Paid hosted plans start at $12/month.',
    },
    {
      q: 'Do I need to download the video first?',
      a: 'No. OpenShorts fetches the video from the pasted URL on every tier, free tiers included.',
    },
  ],
})

/* Recipe-shaped counterpart to /mcp: that page explains the protocol surface,
 * this one shows the working loop. Kept separate so each can rank for its own
 * intent instead of one page diluting both. */
const automateShorts = () => ({
  path: '/automate-shorts-api',
  title: 'Automate Shorts: Clip and Publish Video on a Schedule via API | OpenShorts',
  description:
    'One POST starts the job, one signed webhook ends it, and the clips publish themselves. Automate shorts with the OpenShorts REST API, HMAC webhooks, n8n or cron. No per-call meter; self-hosted has no meter at all.',
  h1: 'Automate shorts end to end: one request in, one webhook out',
  breadcrumb: [{ name: 'Automate shorts' }],
  published: '2026-08-04',
  updated: '2026-08-04',
  tldr: [
    'The whole automation loop is two HTTP messages. You POST a video URL with an API key and a webhook address; when processing ends, OpenShorts sends exactly one signed webhook carrying clip titles and durable download links. No polling loop, no timeout guessing.',
    'API calls draw from the same minute balance as the dashboard, with no separate meter and no per-call pricing. On the self-hosted edition there is no meter at all, which is what makes an always-on pipeline affordable.',
    'For agent-driven automation (Claude, ChatGPT, custom agents) the same account also exposes an MCP server; that protocol surface is documented on its own page.',
  ],
  body: `
<h2>The loop, end to end</h2>
<p>Start a job with one request:</p>
<pre><code>curl -X POST https://api.openshorts.app/api/process \\
  -H "Authorization: Bearer osk_..." -H "Content-Type: application/json" \\
  -d '{"url": "https://youtube.com/watch?v=...", "acknowledged": true,
       "webhook_url": "https://your-server.com/hooks/openshorts",
       "webhook_secret": "your-shared-secret"}'</code></pre>
<p>The response returns a job id immediately. Minutes later, when the clips are
cut, subtitled and archived, OpenShorts POSTs once to your webhook URL with the
job outcome, clip titles and download links durable enough to fetch later. A
failed job also fires the webhook, so your pipeline never hangs on silence.</p>

<h2>Verifying the webhook</h2>
<p>If you passed a <code>webhook_secret</code>, the request carries an
<code>X-OpenShorts-Signature</code> header of the form
<code>sha256=&lt;hex&gt;</code>: the HMAC-SHA256 of the raw request body under
your secret. Recompute it and compare in constant time:</p>
<pre><code>expected = "sha256=" + hmac.new(secret, raw_body, hashlib.sha256).hexdigest()
hmac.compare_digest(expected, request.headers["X-OpenShorts-Signature"])</code></pre>
<p>Reject anything that does not match and you have closed the door on forged
deliveries.</p>

<h2>Using it from n8n, Zapier or Make</h2>
<p>No dedicated node is needed: the flow is a generic HTTP Request step that
POSTs to <code>/api/process</code>, then a Webhook trigger that receives the
completion payload and fans out to whatever comes next, posting to socials,
dropping links in Slack, logging to a sheet. The two-step shape above is the whole integration, which is why generic
nodes cover it. There is now also an importable
<a href="/n8n-youtube-shorts-automation">n8n workflow</a> that wires the whole
loop, including channel watching, Telegram approval and scheduled publishing.</p>

<h2>A weekly pipeline in one cron line</h2>
<p>Because the API is one POST, scheduling is whatever scheduler you already
have. A cron job that submits the latest episode URL every Monday, a GitHub
Action on your podcast repo, or an agent that watches a feed. The webhook does
the second half, so nothing stays running in between. If you would rather not
write the curl, the CLI wraps it:</p>
<pre><code>uvx openshorts process "$EPISODE_URL" \\
  --webhook https://your-server.com/hooks/openshorts \\
  --webhook-secret "$SECRET"</code></pre>

<h2>What automation costs</h2>
<p>API and MCP calls draw from the same minute balance as the dashboard. There
is no per-call price, no separate API tier and no automation surcharge. As of
August 2026 that is not the market default: the mainstream tools meter their
APIs per source minute or per operation, on top of subscription tiers, so an
always-on pipeline runs with a taxi meter attached. Self-hosted OpenShorts has
no meter of any kind, and the hosted plans are flat:</p>
${pricingParagraph}

<h2>Agents instead of scripts</h2>
<p>If the thing driving the pipeline is an AI agent rather than a script, the
same account exposes a native MCP server with six tools covering process,
status, clips, quota, subtitles and publishing. The endpoint, the tool table and
client setup live on the <a href="/mcp">MCP server and API page</a>.</p>

${faqBlock([
  {
    q: 'Can I automate YouTube Shorts creation with an open source tool?',
    a: 'Yes. OpenShorts is MIT-licensed and its self-hosted edition serves the same REST API and MCP server as the hosted service, with no metering. One POST submits a video, a signed webhook returns the finished clips, and the publishing endpoint posts them to YouTube Shorts, TikTok and Instagram Reels.',
  },
  {
    q: 'Is there an n8n integration for OpenShorts?',
    a: 'Yes: an importable workflow at /n8n-youtube-shorts-automation watches a YouTube channel, clips each video, sends the clips to Telegram for approval and schedules the approved ones to your socials. Nothing forces you to use it, though, since the integration is just an HTTP Request node posting to /api/process plus a Webhook trigger.',
  },
  {
    q: 'Do automated API calls cost more than using the dashboard?',
    a: 'No. API and MCP usage draws from the same minute balance as the dashboard with no per-call pricing: 20 free minutes a month on the hosted free tier, flat paid plans from $12/month, and no meter at all on the self-hosted edition.',
  },
])}

${sources([
  `Webhook signing implementation in the project source at <a href="${SITE.repo}" rel="noopener">github.com/mutonby/openshorts</a>.`,
  'Competitor API metering checked 2026-08-04 on public pricing and developer documentation.',
])}
`,
  faq: [
    {
      q: 'Can I automate YouTube Shorts creation with an open source tool?',
      a: 'Yes: OpenShorts self-hosted serves the same REST API, MCP server and signed webhooks as the hosted service, MIT-licensed and unmetered. One POST in, one signed webhook out.',
    },
    {
      q: 'Do automated API calls cost more than using the dashboard?',
      a: 'No. API and MCP calls draw from the same minute balance with no per-call pricing; the self-hosted edition has no meter at all.',
    },
  ],
})

/* The n8n community's two loudest unanswered asks, checked August 2026, are
 * "is there a free/self-hostable clipper I can call from a workflow" and
 * "why is posting a video to TikTok/Instagram so painful". This page answers
 * both with a workflow that exists, and gives the Reddit/forum posts a stable
 * URL to point at that is ours rather than a raw file on GitHub. */
const n8nTemplate = () => ({
  path: '/n8n-youtube-shorts-automation',
  title: 'n8n Template: Clip Your YouTube Channel and Auto-Post Shorts | OpenShorts',
  description:
    'A free n8n workflow that watches your YouTube channel, clips every video into vertical shorts, sends them to Telegram for one-tap approval, and drip-publishes to TikTok, Instagram and YouTube. Webhook-driven, no polling loop. MIT-licensed clipper behind it.',
  h1: 'The n8n content machine: your channel clips itself, you approve from your phone',
  breadcrumb: [{ name: 'n8n template' }],
  published: '2026-08-21',
  updated: '2026-08-21',
  body: `
<figure class="shot">
<img src="/n8n-content-machine-workflow.png" width="950" height="750" loading="eager"
     alt="The OpenShorts content machine open in n8n: four labelled stages, from the daily channel RSS trigger through the clipping call, the Telegram approval buttons and the weekly analytics digest.">
<figcaption>The whole machine is one canvas: watch the channel, clip, approve from Telegram, drip-publish and measure.</figcaption>
</figure>
<p>This workflow runs a YouTube channel on its own without handing over the
publish button. Once a day it reads your channel feed, clips one video into
vertical shorts, and sends each finished clip to your Telegram with Publish and
Skip buttons. What you approve is scheduled one post per day to the accounts you
connected, and every Sunday it reports back what the published clips actually
did. Two credentials, no polling loop, no TikTok or Instagram OAuth app.</p>

<h2>Download the workflow</h2>
<p>The JSON lives in the project repository, not behind an email form:</p>
<ul>
<li><a href="${SITE.repo}/blob/main/examples/n8n/openshorts-content-machine.json" rel="noopener">openshorts-content-machine.json</a> — the full four-stage machine described below.</li>
<li><a href="${SITE.repo}/blob/main/examples/n8n/openshorts-clip-and-notify.json" rel="noopener">openshorts-clip-and-notify.json</a> — the minimal version: a form takes a video URL, a signed webhook returns the clips.</li>
<li><a href="${SITE.repo}/tree/main/examples/n8n" rel="noopener">Setup notes</a> — credentials, the webhook secret, and the known limits.</li>
</ul>
<p>In n8n: <strong>Workflows → Import from file</strong>, then fill in your channel
id and chat id where the sticky notes on the canvas say so.</p>

<h2>What the workflow actually does</h2>
<p>Four stages, all on one canvas:</p>
<ol>
<li><strong>Watch the channel.</strong> A daily schedule trigger reads
<code>youtube.com/feeds/videos.xml?channel_id=...</code>, which needs no YouTube
API key, and picks one video: your newest upload, or if there is nothing new,
the next unprocessed video from your back catalogue. One video a day keeps the
minute burn predictable, and a 402 (out of minutes) pauses the machine with a
Telegram notice instead of failing silently.</li>
<li><strong>Clip, then get called back.</strong> One HTTP request to
<code>/api/process</code> carrying a <code>webhook_url</code>. When the job
ends, OpenShorts POSTs once with the finished clips and durable download links.
There is no Wait node anywhere in the workflow.</li>
<li><strong>Approve from your phone.</strong> Each 9:16 clip arrives in Telegram
as a video message with Publish and Skip buttons. A human approves every post,
which is also what separates this from the fully automated pipelines that
YouTube's inauthentic-content policy targets.</li>
<li><strong>Drip-publish and measure.</strong> Approved clips take the next free
daily slot and post to the accounts you connected in OpenShorts. Every Sunday
the workflow reads back the analytics of what it published and sends you
impressions, per-platform split and your best post.</li>
</ol>

<h2>Why posting does not need TikTok or Instagram credentials</h2>
<p>The usual wall in an n8n video workflow is the publishing half: TikTok
requires an audited app to post publicly, and the Instagram Graph API refuses
anything that is not a public static URL, which is why Google Drive links fail
there. This workflow sidesteps both by posting through
<code>POST /api/social/post</code> against the networks you connected once in
your OpenShorts account. The workflow itself holds no social credentials, and
the clip file is already on durable storage, so the public-URL requirement is
satisfied before Instagram ever sees it.</p>

<h2>Scheduling that does not double-book</h2>
<p>Approving two clips seconds apart used to be enough to publish them at the
same minute: each execution read the same in-memory counter before either wrote
back. The workflow now asks the server for the queue it actually holds
(<code>GET /api/social/scheduled</code>) and picks the first free slot from it,
which is shared state and cannot race with itself that way. The same endpoint,
plus <code>DELETE /api/social/scheduled/{job_id}</code>, is how you inspect or
cancel a post before it goes out.</p>

<h2>What it costs to run</h2>
${pricingParagraph}
<p>API calls draw from the same minute balance as the dashboard: no per-call
price, no automation surcharge, and no meter at all on the self-hosted edition.
Telegram bots are free, and n8n runs wherever you already run it.</p>

<h2>Known limits, before you find them the hard way</h2>
<ul>
<li>Telegram previews a video by URL up to about 20 MB; larger clips arrive as a
link message carrying the same approval buttons.</li>
<li>A YouTube channel RSS feed exposes only the latest 15 videos, so the
back-catalogue drip reaches back that far and no further.</li>
<li>The Telegram Trigger node needs your n8n to have a public https URL, because
Telegram registers a webhook against it. A laptop-local n8n can run every other
stage, but the approval buttons need a deployed instance or a tunnel.</li>
<li>Workflow static data, where the machine remembers which videos it already
processed, only persists on production executions. Test runs from the editor do
not advance it.</li>
</ul>

<h2>Prefer an agent to a workflow?</h2>
<p>The same account exposes an MCP server, so Claude, ChatGPT or an n8n AI Agent
node can drive the pipeline as tools instead of fixed steps. That surface is
documented on the <a href="/mcp">MCP server and API page</a>, and the raw REST
loop on the <a href="/automate-shorts-api">automation page</a>.</p>

${faqBlock([
  {
    q: 'Is there a free n8n template to turn long videos into shorts?',
    a: 'Yes. OpenShorts publishes an MIT-licensed n8n workflow that clips a YouTube channel automatically and posts the approved clips to TikTok, Instagram and YouTube. The JSON is in the project repository with no email gate, and the clipper behind it is open source, so it can run entirely on your own hardware.',
  },
  {
    q: 'How do I post a video to TikTok or Instagram from n8n?',
    a: 'Neither platform has a native n8n node, and both have hard requirements: TikTok needs an audited app for public posts and Instagram needs a public static URL for the media. Posting through the OpenShorts API avoids both, because the accounts are connected once in your OpenShorts account and the clip already lives on durable public storage.',
  },
  {
    q: 'Does the workflow poll for the clipping job to finish?',
    a: 'No. Clipping a real video takes minutes, so the workflow passes a webhook_url with the job and OpenShorts calls it exactly once when the job reaches a terminal state. Failed jobs fire the same webhook with an error field, so the flow never hangs.',
  },
  {
    q: 'Can the clips publish without me approving them?',
    a: 'They can, by connecting the posting step directly to the webhook branch, but the template ships with the approval gate on purpose: unreviewed automated publishing is what YouTube\'s inauthentic-content policy targets, and one bad clip lands on your own audience.',
  },
])}

${sources([
  `Workflow JSON and setup notes in the project repository at <a href="${SITE.repo}/tree/main/examples/n8n" rel="noopener">github.com/mutonby/openshorts</a>.`,
  'TikTok and Instagram publishing constraints checked against their developer documentation, August 2026.',
])}
`,
  faq: [
    {
      q: 'Is there a free n8n template to turn long videos into shorts?',
      a: 'Yes: OpenShorts ships an MIT-licensed n8n workflow that clips a YouTube channel automatically and posts approved clips to TikTok, Instagram and YouTube. The JSON is public in the repository with no email gate.',
    },
    {
      q: 'How do I post a video to TikTok or Instagram from n8n?',
      a: 'Post through the OpenShorts API: the social accounts are connected once in your OpenShorts account, so the workflow needs no TikTok app audit and no public CDN URL for the file.',
    },
  ],
})

const mcpAgentsPage = () => ({
  path: '/mcp',
  title: 'Automate Video Clipping with AI Agents: MCP Server, API & Webhooks | OpenShorts',
  description:
    'OpenShorts ships a built-in MCP server, so Claude, ChatGPT, Cursor or n8n can clip and publish videos for you. REST API with keys, completion webhooks, self-hostable. Hosted from $12/month.',
  h1: 'Clip and publish video from an AI agent',
  breadcrumb: [{ name: 'MCP server and API' }],
  tldr: [
    'OpenShorts has a native MCP server at mcp.openshorts.app/mcp. Connect any MCP client, Claude, ChatGPT, Cursor or a custom agent, and a prompt like "clip this podcast and schedule the best three to TikTok" becomes one instruction instead of an afternoon in an editor.',
    'Eight tools cover the whole pipeline: process_video, create_upload, get_job_status, list_clips, get_quota, add_subtitles, recut_clip and publish_clip. There is also a plain REST API with per-user keys, and completion webhooks so pipelines never poll.',
    'The difference that survives comparison shopping is the meter. Most clipping tools now have an API, and Opus Clip added an MCP server in July 2026, but they meter agent calls per source minute or per operation. OpenShorts API calls draw from the same flat minute balance as the dashboard, and the self-hosted edition, free and MIT-licensed, serves the same MCP endpoint with no meter at all.',
  ],
  body: `
<h2>What can an agent actually do with OpenShorts?</h2>
<p>Everything the dashboard does. The MCP server is not a wrapper around a
subset of features: each tool calls the same pipeline the web app uses, with the
same account, the same minutes and the same job history. An agent can take a
YouTube URL, turn it into 3 to 15 vertical clips with word-level captions,
restyle those captions, and publish or schedule the result to TikTok, Instagram
Reels and YouTube Shorts.</p>

<h2>How do I connect Claude or ChatGPT?</h2>
<p>With the URL alone. The server implements OAuth 2.1 with dynamic client
registration, which is what claude.ai and ChatGPT expect from a remote MCP
server, so there is no key to copy:</p>
<ol>
<li><strong>claude.ai:</strong> Settings, Connectors, Add custom connector, paste <code>https://mcp.openshorts.app/mcp</code>, Connect.</li>
<li><strong>ChatGPT:</strong> Settings, Connectors, Create, paste the same URL, choose OAuth.</li>
<li>Approve the access on openshorts.app (sign in if you are not). The 8 tools appear in every chat, and the connection is listed under Account, API keys, where revoking it disconnects the app.</li>
</ol>
<h2>How do I connect Claude Code, Cursor or n8n?</h2>
<p>CLI and workflow clients take an API key instead: create one in your account
page (shown once, starts with <code>osk_</code>) and pass it as a Bearer
token. With Claude Code:</p>
<pre><code>claude mcp add --transport http openshorts https://mcp.openshorts.app/mcp \\
  --header "Authorization: Bearer osk_..."</code></pre>
<p>Any client that speaks Streamable HTTP works the same way: the endpoint is
<code>https://mcp.openshorts.app/mcp</code>, the server describes itself over
the protocol, tool schemas included, and the account page has copy-ready
snippets for Claude Desktop, Cursor, n8n and curl.</p>

<h2>What tools does the MCP server expose?</h2>
<table>
<thead><tr><th>Tool</th><th>What it does</th></tr></thead>
<tbody>
<tr><td><code>process_video</code></td><td>Starts clipping a video from a URL or an upload_id. Returns a job id immediately; processing takes minutes. Pass captions: false when the source already has subtitles burned in, auto_hook: false to skip the hook line (on by default).</td></tr>
<tr><td><code>create_upload</code></td><td>Reserves an upload slot for a local file: the agent PUTs the bytes to the returned URL, then processes it by upload_id.</td></tr>
<tr><td><code>get_job_status</code></td><td>Progress, recent log lines, and the clips once the job completes.</td></tr>
<tr><td><code>list_clips</code></td><td>Titles, durations, platform-ready descriptions and download URLs for a finished job.</td></tr>
<tr><td><code>get_quota</code></td><td>Plan and remaining minutes, so an agent can check before starting a large job.</td></tr>
<tr><td><code>add_subtitles</code></td><td>Restyles the burned-in captions of one clip, classic or karaoke word highlighting.</td></tr>
<tr><td><code>publish_clip</code></td><td>Posts or schedules one clip to TikTok, Instagram or YouTube through the connected account.</td></tr>
</tbody>
</table>
<p>In clients that support the MCP Apps extension (ChatGPT apps, mcp-ui hosts),
<code>list_clips</code> also renders as an interactive clip picker: preview each
9:16 clip inline, select the keepers and publish them without leaving the
conversation. Clients without UI support see the same data as plain results.</p>

<h2>How does this compare to the other clipping tools' agent access?</h2>
<p class="checked">Checked 2026-08-04 on vendor developer documentation and pricing pages. This market is moving fast; verify before committing a pipeline.</p>
<p>Agent access stopped being exclusive in 2026: Opus Clip launched its own MCP
server in July, Reap ships MCP plus a CLI, and Klap, Vizard and Submagic have
REST APIs. A comparison that pretended otherwise would not deserve your trust.
What still separates the offerings is how agent calls are billed and where the
server can run:</p>
<table>
<thead><tr><th>Tool</th><th>MCP server</th><th>REST API</th><th>How agent calls are billed</th></tr></thead>
<tbody>
<tr><td class="os">OpenShorts</td><td class="os yes">Yes, hosted and self-hosted</td><td class="os yes">Yes, with signed webhooks</td><td class="os">Same flat minute balance as the dashboard; self-hosted has no meter</td></tr>
<tr><td>Opus Clip</td><td class="yes">Yes, since July 2026</td><td>Yes</td><td>Credits per source minute, expiring in 60 days</td></tr>
<tr><td>Reap</td><td class="yes">Yes, plus CLI</td><td>Yes</td><td>Subscription from $9.99/month, metered minutes</td></tr>
<tr><td>Klap</td><td>No</td><td>Yes</td><td>Per operation, roughly $0.32 to $0.48 each</td></tr>
<tr><td>Vizard</td><td>No</td><td>Yes, with webhooks</td><td>Consumes plan upload minutes</td></tr>
<tr><td>Submagic</td><td>No</td><td>Yes, Business tier ($69/month)</td><td>Metered per minute on top of the tier</td></tr>
</tbody>
</table>
<p>The consequence for an autonomous pipeline is simple: an agent loop on a
metered API runs with the bill still attached to every decision it makes. On a
flat plan the worst an agent can do is spend your minutes; on the self-hosted
edition there is nothing to spend. For the recipe-shaped version of this,
webhooks, n8n and cron, see <a href="/automate-shorts-api">automating shorts
with the API</a>.</p>

<h2>Can I use a plain REST API instead of MCP?</h2>
<p>Yes. The same <code>osk_</code> key authenticates against the REST API, and
interactive documentation lives at
<a href="https://api.openshorts.app/docs" rel="noopener">api.openshorts.app/docs</a>
with the OpenAPI spec at <code>/openapi.json</code>. A processing job is one
request:</p>
<pre><code>curl -X POST https://api.openshorts.app/api/process \\
  -H "Authorization: Bearer osk_..." -H "Content-Type: application/json" \\
  -d '{"url": "https://youtube.com/watch?v=...", "acknowledged": true,
       "webhook_url": "https://your-server.com/hooks/openshorts"}'</code></pre>

<h2>Is there a CLI?</h2>
<p>Yes, a zero-dependency one on PyPI. It talks to the same REST surface as
everything else, so the terminal, the dashboard and the agents can never
disagree about what a job did:</p>
<pre><code>pip install openshorts   # or: uvx openshorts

export OPENSHORTS_API_KEY=osk_...
openshorts process "https://youtube.com/watch?v=..." --wait
openshorts clips &lt;job_id&gt;
openshorts publish &lt;job_id&gt; 0 --platforms tiktok,youtube</code></pre>
<p>Point <code>OPENSHORTS_API_URL</code> at <code>http://localhost:8000</code>
and the same binary drives a self-hosted instance with no key.</p>

<h2>How do completion webhooks work?</h2>
<p>Pass <code>webhook_url</code> when starting a job and OpenShorts sends
exactly one POST when the job finishes or fails, with clip titles and download
links in the body. Add a <code>webhook_secret</code> and the body is signed with
HMAC-SHA256 in the <code>X-OpenShorts-Signature</code> header so your receiver
can verify the sender. This is what lets an n8n, Zapier or cron pipeline run
without a polling loop.</p>

<h2>Does this work on the self-hosted edition?</h2>
<p>Yes. The self-hosted edition serves the same <code>/mcp</code> endpoint on
your own machine, with no API key required because there is no account system:
it follows the same bring-your-own-key rules as the rest of the self-hosted app.
Point your MCP client at <code>http://localhost:8000/mcp</code> and the same six
tools appear.</p>

<h2>What does it cost?</h2>
${pricingParagraph}
<p>API and MCP calls are not billed separately: they draw from the same minute
balance as the dashboard, so automation does not change the price of anything.</p>

${faqBlock([
  {
    q: 'Does OpenShorts have an MCP server?',
    a: 'Yes, a native one at mcp.openshorts.app/mcp using the Streamable HTTP transport. It exposes eight tools covering the full pipeline: process_video, create_upload, get_job_status, list_clips, get_quota, add_subtitles, recut_clip and publish_clip. Authentication is an API key created in the dashboard, sent as a Bearer token.',
  },
  {
    q: 'Can Claude or ChatGPT create video clips with OpenShorts?',
    a: 'Yes. Any MCP-capable client, including Claude and ChatGPT, can connect to mcp.openshorts.app/mcp with an API key and drive the whole flow: submit a video URL, wait for processing, list the generated clips and publish them to TikTok, Instagram or YouTube.',
  },
  {
    q: 'Is there an API for OpenShorts?',
    a: 'Yes, a REST API documented at api.openshorts.app/docs, authenticated with per-user osk_ keys created in the dashboard. It covers processing, status, subtitles, publishing and completion webhooks.',
  },
  {
    q: 'Do API calls cost extra?',
    a: 'No. API and MCP usage draws from the same minute balance as the dashboard: 20 free minutes a month on the hosted free tier, and paid plans from $12/month. The self-hosted edition is free under MIT and serves the same endpoints with no metering. Most competing APIs are billed per source minute or per operation on top of a subscription.',
  },
  {
    q: 'How is this different from the Opus Clip MCP server?',
    a: 'The tool surface is similar: both expose around six tools covering processing, captions and publishing. The differences are billing and deployment. Opus Clip meters MCP usage in credits per source minute, and those credits expire in 60 days; OpenShorts draws from a flat minute balance with no per-call pricing. And only OpenShorts can run the same MCP server on your own machine, unmetered, because the code is MIT-licensed.',
  },
])}

${sources([
  `MCP specification and transports at <a href="https://modelcontextprotocol.io" rel="noopener">modelcontextprotocol.io</a>.`,
  `OpenShorts server implementation in the project source at <a href="${SITE.repo}" rel="noopener">github.com/mutonby/openshorts</a>.`,
])}
`,
  faq: [
    {
      q: 'Does OpenShorts have an MCP server?',
      a: 'Yes, a native MCP server at mcp.openshorts.app/mcp with six tools covering the full pipeline, authenticated with an API key created in the dashboard.',
    },
    {
      q: 'Can Claude or ChatGPT create video clips with OpenShorts?',
      a: 'Yes. Any MCP-capable client can connect with an API key and drive the whole flow from video URL to published clip.',
    },
    {
      q: 'Do API calls cost extra?',
      a: 'No. API and MCP usage draws from the same minute balance as the dashboard: 20 free minutes a month on the hosted free tier, paid plans from $12/month, and the self-hosted edition is free under MIT.',
    },
    {
      q: 'How is this different from the Opus Clip MCP server?',
      a: 'Similar tool surface, different billing and deployment: Opus Clip meters MCP usage in credits per source minute that expire in 60 days, while OpenShorts draws from a flat minute balance, and only OpenShorts can run the same MCP server self-hosted and unmetered.',
    },
  ],
})

export function buildPages() {
  // Ring order matters: relatedFor links each page to the next three, so
  // neighbours are chosen to be topically adjacent.
  return [
    hubPage(),
    ...ALTERNATIVES.map(competitorPage),
    freeClipGenerator(),
    noWatermark(),
    openSourceClipper(),
    openSourceVideoGenerator(),
    howItWorks(),
    podcastToShorts(),
    youtubeConverter(),
    mcpAgentsPage(),
    automateShorts(),
    n8nTemplate(),
  ]
}

/* Each page links to three siblings. Small, described clusters beat a single
 * dump of every URL: the described link tells an engine what it will find. */
export function relatedFor(page, all) {
  const blurb = {
    '/alternatives': 'All four tools compared, with entry pricing.',
    '/alternatives/opus-clip': 'Per-minute credits, 720p vs 1080p, and where each one wins.',
    '/alternatives/klap': 'Fastest URL-to-clip path, and what you give up for it.',
    '/alternatives/vizard': 'Timeline editing after the AI pass, and who needs it.',
    '/alternatives/submagic': 'Captions only, so it does not replace a clipper.',
    '/free-ai-clip-generator': 'What free means when there is no metering code.',
    '/free-ai-clip-generator-no-watermark': 'Why free tools watermark, and the structural exception.',
    '/open-source-video-clipper': 'Self-hosting with Docker, and the MIT licence carve-out.',
    '/open-source-ai-video-generator': 'Text-to-video or clips from your footage: which you want.',
    '/how-openshorts-works': 'The full pipeline, stage by stage.',
    '/podcast-to-shorts': 'Two-speaker episodes without cropping anyone out.',
    '/youtube-to-shorts-converter': 'Paste a link, get 9:16 clips with subtitles.',
    '/mcp': 'Drive the whole pipeline from Claude, ChatGPT or n8n.',
    '/automate-shorts-api': 'One POST in, one signed webhook out, no polling.',
    '/n8n-youtube-shorts-automation': 'The importable workflow: channel in, approved shorts out.',
  }
  // Walk the ring starting after this page so each page links to a different
  // three. Slicing the same head every time would leave the last pages in the
  // list with no inbound links at all.
  const i = all.findIndex((p) => p.path === page.path)
  return [1, 2, 3]
    .map((n) => all[(i + n) % all.length])
    .filter((p) => p && p.path !== page.path)
    .map((p) => ({ path: p.path, title: p.h1, blurb: blurb[p.path] || p.description }))
}
