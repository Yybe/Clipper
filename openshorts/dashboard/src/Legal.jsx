import React from 'react';
import { ArrowLeft, FileText, Shield, Landmark } from 'lucide-react';

// The canonical legal documents are the static pages emitted at build time by
// vite-plugin-seo from seo/legal.js (/terms, /privacy, /legal-notice + Spanish
// versions). This in-app view is a hub with the plain-language summary and
// links, so the SPA route (#legal) and the crawlable pages never drift: the
// full text lives in exactly one place.
const LAST_UPDATED = '2026-08-24';
const SUPPORT_EMAIL = 'info@openshorts.app';

const DOCS = [
    {
        icon: FileText,
        title: 'Terms of Service',
        desc: 'What you can do with the service, your content rights, billing, EU withdrawal, and acceptable use.',
        href: '/terms',
        es: '/terminos',
    },
    {
        icon: Shield,
        title: 'Privacy Policy',
        desc: 'What we store, for how long, which providers touch it, and your GDPR rights. No third-party trackers.',
        href: '/privacy',
        es: '/privacidad',
    },
    {
        icon: Landmark,
        title: 'Legal Notice',
        desc: 'Who operates openshorts.app: TONVI TECH SL, Málaga, Spain (LSSI-CE art. 10).',
        href: '/legal-notice',
        es: '/aviso-legal',
    },
];

export default function Legal() {
    const handleBack = () => {
        window.location.hash = '';
    };

    return (
        <div className="min-h-screen bg-paper text-ink2">
            <header className="border-b border-rule sticky top-0 bg-paper z-10">
                <div className="max-w-[65ch] mx-auto px-6 py-3 flex items-center">
                    <button onClick={handleBack} className="btn-quiet">
                        <ArrowLeft size={16} /> Back
                    </button>
                </div>
            </header>

            <main className="max-w-[65ch] mx-auto px-6 py-12">
                <h1 className="font-display lowercase text-3xl md:text-4xl text-ink mb-3">Terms & Privacy</h1>
                <p className="readout mb-10">Last updated: {LAST_UPDATED}</p>

                <div className="text-ink2 leading-relaxed space-y-3 text-sm mb-10">
                    <p>The short version:</p>
                    <ul className="list-disc pl-6 space-y-2">
                        <li><strong className="text-ink">Your videos and clips are yours.</strong> We never use your content to train AI models.</li>
                        <li><strong className="text-ink">You must have the rights</strong> to every video you upload or link, and you are the publisher of what you post.</li>
                        <li><strong className="text-ink">No third-party trackers.</strong> Analytics is self-hosted; free-plan clips are deleted after 7 days.</li>
                        <li><strong className="text-ink">Cancel anytime</strong> from your account. EU consumers keep their 14-day withdrawal right.</li>
                        <li><strong className="text-ink">Delete everything anytime.</strong> Account &rarr; Delete account erases your projects, clips and keys on the spot. No email to us, no waiting.</li>
                    </ul>
                    <p>
                        The full documents (English, with Spanish versions that prevail for consumers in Spain):
                    </p>
                </div>

                <div className="space-y-3 mb-12">
                    {DOCS.map(({ title, desc, href, es }) => (
                        <a
                            key={href}
                            href={href}
                            className="flex items-start gap-4 p-4 border border-rule rounded-card hover:border-brass transition-colors"
                        >
                            <Icon size={18} className="text-brass shrink-0 mt-0.5" />
                            <span>
                                <span className="block text-ink font-medium">{title}</span>
                                <span className="block text-sm text-muted mt-1">{desc}</span>
                                <span className="block text-xs text-muted mt-1 underline underline-offset-2">
                                    también en español: {es}
                                </span>
                            </span>
                        </a>
                    ))}
                </div>

                <p className="text-sm text-muted">
                    openshorts.app is operated by TONVI TECH SL (CIF B-19780394), Calle Puerta del Mar 18,
                    29005 Málaga, Spain. Questions:{' '}
                    <a className="underline underline-offset-2 hover:text-brass transition-colors" href={`mailto:${SUPPORT_EMAIL}`}>
                        {SUPPORT_EMAIL}
                    </a>
                    . Self-hosted instances are operated by their administrators under the MIT License; these
                    documents govern the hosted service only.
                </p>
            </main>
        </div>
    );
}
