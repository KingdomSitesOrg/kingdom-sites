import type { ReactNode } from 'react';
import { Container, IconLinkedIn, IconX, IconYouTube, Logo, type IconProps } from '@/strata/ui';
import { NewsletterField } from './NewsletterField';

type FooterLink = { label: string; href?: string };

/** Links that map to a section of this page point there; the rest stay on the footer (STORYBOARD 7.10). */
const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'AI modeling', href: '#idea' },
      { label: 'Optimization', href: '#optimize' },
      { label: 'Instant quoting', href: '#quote' },
      { label: 'Materials', href: '#object' },
      { label: 'API', href: '#features' },
    ],
  },
  {
    title: 'Machines',
    links: [
      { label: 'FDM', href: '#print' },
      { label: 'Resin SLA', href: '#machines' },
      { label: 'Nylon SLS', href: '#machines' },
      { label: 'Metal LPBF', href: '#machines' },
      { label: 'The fleet', href: '#fleet' },
    ],
  },
  {
    title: 'Company',
    links: [{ label: 'About' }, { label: 'Plants' }, { label: 'Careers' }, { label: 'Press' }, { label: 'Contact' }],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Docs' },
      { label: 'Design guide' },
      { label: 'Material data' },
      { label: 'Status' },
      { label: 'Changelog' },
    ],
  },
  {
    title: 'Legal',
    links: [{ label: 'Terms' }, { label: 'Privacy' }, { label: 'Security' }, { label: 'Export compliance' }],
  },
];

function IconGitHub({ size = 24, className }: Pick<IconProps, 'size' | 'className'>) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 19.5c-4.2 1.3-4.2-2.2-6-2.7M15 21.5v-3.4a3 3 0 0 0-.84-2.3c2.8-.3 5.74-1.38 5.74-6.2a4.8 4.8 0 0 0-1.33-3.33 4.5 4.5 0 0 0-.08-3.3s-1.05-.32-3.45.97a11.9 11.9 0 0 0-6.2 0C6.44 2.65 5.4 2.97 5.4 2.97a4.5 4.5 0 0 0-.08 3.3A4.8 4.8 0 0 0 4 9.6c0 4.8 2.93 5.88 5.73 6.2A3 3 0 0 0 9 18.1v3.4" />
    </svg>
  );
}

const SOCIALS: { label: string; icon: (p: { size: number; className: string }) => ReactNode }[] = [
  { label: 'STRATA on GitHub', icon: (p) => <IconGitHub {...p} /> },
  { label: 'STRATA on X', icon: (p) => <IconX {...p} /> },
  { label: 'STRATA on LinkedIn', icon: (p) => <IconLinkedIn {...p} /> },
  { label: 'STRATA on YouTube', icon: (p) => <IconYouTube {...p} /> },
];

/** STORYBOARD 7.10. */
export default function Footer() {
  return (
    <footer id="footer" aria-labelledby="footer-title" className="relative overflow-hidden border-t border-line bg-bg-2">
      <h2 id="footer-title" className="sr-only">
        Site map
      </h2>
      <Container className="pb-10 pt-24">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col items-start lg:col-span-4">
            <div className="flex items-center gap-3">
              <Logo variant="mark" decorative className="h-6" />
              <span className="font-display text-[22px] font-semibold leading-none tracking-[-0.02em] text-text-1">
                STRATA
              </span>
            </div>
            <p className="mt-5 text-body text-text-2">Every object starts as a layer.</p>
            <ul className="mt-8 flex gap-2">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a
                    href="#footer"
                    aria-label={s.label}
                    className="flex size-11 items-center justify-center rounded-full border border-line text-text-2 transition-colors duration-[var(--duration-base)] hover:border-line-strong hover:bg-white/[0.04] hover:text-text-1"
                  >
                    {s.icon({ size: 18, className: 'shrink-0' })}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-5">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="hud-label text-text-3">{col.title}</h3>
                <ul className="mt-3.5 flex flex-col">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href ?? '#footer'}
                        className="-mx-1 inline-flex min-h-9 items-center whitespace-nowrap rounded-xs px-1 text-[14px] leading-6 text-text-2 transition-colors duration-[var(--duration-base)] hover:text-text-1"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-20 grid gap-8 rounded-[20px] border border-line bg-bg-3 p-8 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] lg:grid-cols-12 lg:items-center lg:gap-8 lg:px-10 lg:py-9">
          <div className="lg:col-span-5">
            <h3 className="text-h3 text-text-1">Layer notes</h3>
            <p className="mt-2 max-w-[44ch] text-[15px] leading-[22px] text-text-2">
              One email a month. New materials, open machine time and design tricks from our application engineers.
            </p>
          </div>
          <NewsletterField className="lg:col-span-6 lg:col-start-7" />
        </div>

        <div className="mt-16 grid gap-3 border-t border-line pt-8 text-[13px] leading-5 text-text-3 lg:grid-cols-12 lg:gap-8">
          <p className="lg:col-span-5">© 2026 STRATA Fabrication, Inc. (fictional)</p>
          <p className="max-w-[60ch] text-pretty lg:col-span-6 lg:col-start-7">
            STRATA is a fictional company. Every customer, person, number and product on this page is invented for a
            design showcase.
          </p>
        </div>
        <div
          aria-hidden
          className="pointer-events-none mt-20 select-none [mask-image:linear-gradient(180deg,black_15%,transparent_115%)]"
        >
          <Logo variant="wordmark" sliced decorative style={{ width: '100%', height: 'auto', color: 'var(--line-strong)' }} />
        </div>
      </Container>
    </footer>
  );
}
