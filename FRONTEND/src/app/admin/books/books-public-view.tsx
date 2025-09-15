'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

// ——— Types ———
export type Person = { id: string; name: string; role?: string };
export type BookLink = { label: string; href: string };
export type BookSection = { id: string; title: string; children?: BookSection[] };
export type BookMeta = {
  language?: string;
  script?: string;
  edition?: string;
  publisher?: string;
  publishedOn?: string;
  isbn10?: string;
  isbn13?: string;
  doi?: string;
  pages?: number;
  binding?: 'Hardcover' | 'Paperback' | 'Digital';
  categories?: string[];
};
export type Book = {
  id: string;
  slug?: string;
  title: string;
  subtitle?: string;
  coverUrl?: string;
  bannerUrl?: string;
  gradient?: string;
  description?: string;
  contributors: Person[];
  curators?: Person[];
  links?: BookLink[];
  sections?: BookSection[];
  tags?: string[];
  meta?: BookMeta;
  rating?: number;
  ratingCount?: number;
  readingTime?: string;
  wordCount?: number;
  collections?: string[];
};

// ——— Utilities ———
function cx(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}
const sizeMap: Record<number, string> = { 3: 'w-3 h-3', 4: 'w-4 h-4', 5: 'w-5 h-5', 6: 'w-6 h-6' };

// ——— UI: Stars ———
function Stars({ value = 0, outOf = 5, size = 4 }: { value?: number; outOf?: number; size?: number }) {
  const rounded = Math.round(value * 2) / 2;
  const sizeCls = sizeMap[size] ?? sizeMap[4];
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating ${value} of ${outOf}`}>
      {Array.from({ length: outOf }).map((_, i) => {
        const idx = i + 1;
        const full = rounded >= idx;
        return (
          <svg
            key={i}
            viewBox="0 0 24 24"
            className={cx('inline-block', sizeCls, full ? 'fill-black dark:fill-white' : 'fill-gray-300 dark:fill-gray-600')}
            aria-hidden="true"
          >
            <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21 12 17.27z" />
          </svg>
        );
      })}
    </div>
  );
}

// ——— UI: Chip ———
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border border-gray-400 bg-white px-3 py-1 text-xs font-medium text-gray-900 dark:border-gray-600 dark:bg-black dark:text-white">{children}</span>
  );
}

// ——— UI: Section Title ———
function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-center justify-between">
      <h3 className="text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100">{children}</h3>
      {right}
    </div>
  );
}

// ——— UI: TOC Tree ———
function TocTree({ nodes = [] as BookSection[] }) {
  if (!nodes?.length) return <p className="text-sm text-gray-500">No table of contents available.</p>;
  return (
    <ul className="space-y-1">
      {nodes.map((n) => (
        <li key={n.id} className="group">
          <div className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400 group-hover:bg-gray-600 dark:bg-gray-600 dark:group-hover:bg-gray-500" />
            <span className="text-sm text-gray-900 group-hover:underline dark:text-gray-100">{n.title}</span>
          </div>
          {n.children?.length ? (
            <div className="ms-3 border-l border-gray-400 pl-3 dark:border-gray-700">
              <TocTree nodes={n.children} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

// ——— UI: Tabs ———
function Tabs({ tabs, current, onChange }: { tabs: string[]; current: string; onChange: (t: string) => void }) {
  return (
    <div className="relative overflow-x-auto">
      <div className="flex gap-1">
        {tabs.map((t) => {
          const active = t === current;
          return (
            <button
              key={t}
              type="button"
              onClick={() => onChange(t)}
              className={cx(
                'rounded-full px-3 py-1.5 text-sm font-medium',
                active ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700'
              )}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ——— UI: Book Cover ———
function BookCover({ url, title, gradient }: { url?: string; title: string; gradient?: string }) {
  return (
    <div className="relative aspect-[3/4] w-36 overflow-hidden rounded-xl border border-gray-400 shadow-sm sm:w-40 md:w-44">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={`${title} cover`} className="h-full w-full object-cover" />
      ) : (
        <div className={cx('flex h-full w-full items-end justify-start p-3 text-left bg-gray-200 dark:bg-gray-800', gradient)}>
          <div className="line-clamp-6 text-[13px] font-semibold text-gray-900 dark:text-gray-100">{title}</div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-black/5 dark:ring-white/10" />
    </div>
  );
}

// ——— UI: Banner ———
function BookBanner({ bannerUrl, title }: { bannerUrl?: string; title: string }) {
  return (
    <div className="relative h-40 w-full overflow-hidden rounded-xl border border-gray-400 sm:h-56 md:h-64 lg:h-72">
      {bannerUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bannerUrl} alt={`${title} banner`} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-800">
          <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">{title}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-black/10" />
    </div>
  );
}

// ——— MAIN ———
export default function BookProfile({ book: incoming }: { book?: Book }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);

  const book = useMemo(() => incoming ?? demoBook, [incoming]);
  const [tab, setTab] = useState('Overview');
  const tabs = ['Overview', 'TOC', 'Annotations', 'Metadata', 'Related'];

  async function handleCollect() {
    try {
      setAdding(true);
      await fetch('/api/library/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refId: book.id,
          refType: 'Book',
          title: book.title,
          author: book.contributors?.[0]?.name,
          coverUrl: book.coverUrl,
          meta: book.meta,
        }),
      });
      setAdded(true);
    } finally {
      setAdding(false);
    }
  }

  function handleRead() {
    startTransition(() => {
      router.push(`/admin/living-document?bookId=${book.id}`);
    });
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
      {/* Cover Banner */}
      <BookBanner bannerUrl={book.bannerUrl} title={book.title} />

      {/* Profile Card overlapping the banner */}
      <motion.header
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative -mt-16 flex flex-col items-center gap-4 rounded-xl border border-gray-400 bg-white p-6 shadow-sm dark:bg-black md:-mt-20 md:flex-row md:items-end"
      >
        {/* Profile Image */}
        <div className="shrink-0">
          <BookCover url={book.coverUrl} title={book.title} gradient={book.gradient} />
        </div>

        {/* Profile Info + Actions */}
        <div className="w-full flex-1">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between">
            {/* Left: Book Info */}
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">{book.title}</h1>
              {book.subtitle ? <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{book.subtitle}</p> : null}

              {book.contributors?.length ? (
                <p className="mt-2 text-sm text-gray-800 dark:text-gray-200">
                  {book.contributors.map((p) => (p.role ? `${p.name} (${p.role})` : p.name)).join(' · ')}
                </p>
              ) : null}

              <div className="mt-2 flex items-center justify-center gap-2 md:justify-start">
                <Stars value={book.rating ?? 0} />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{(book.rating ?? 0).toFixed(1)} ({book.ratingCount ?? 0})</span>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                {book.meta?.language ? <Chip>{book.meta.language}</Chip> : null}
                {book.meta?.script ? <Chip>{book.meta.script}</Chip> : null}
                {book.meta?.edition ? <Chip>{book.meta.edition}</Chip> : null}
                {book.readingTime ? <Chip>⏱ {book.readingTime}</Chip> : null}
                {book.meta?.pages ? <Chip>{book.meta.pages} pages</Chip> : null}
              </div>

              {/* Secondary Follow */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => {}}
                  className="rounded-full border border-gray-400 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:border-gray-600 dark:bg-black dark:text-white dark:hover:bg-gray-800"
                >
                  Follow
                </button>
              </div>
            </div>

            {/* Right: Big Actions */}
            <div className="mt-4 flex flex-col items-center gap-3 md:mt-0 md:flex-row md:items-end md:gap-4">
              <button
                type="button"
                onClick={handleRead}
                disabled={isPending}
                className="rounded-lg bg-black px-6 py-3 text-base font-semibold text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                Read
              </button>
              <button
                type="button"
                onClick={handleCollect}
                disabled={adding || added}
                className="rounded-lg border border-gray-400 bg-white px-6 py-3 text-base font-semibold text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:border-gray-600 dark:bg-black dark:text-white dark:hover:bg-gray-800"
              >
                {added ? 'Added to Shelf' : adding ? 'Adding…' : 'Add to Shelf'}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Tabs */}
      <div className="mt-8">
        <Tabs tabs={tabs} current={tab} onChange={setTab} />
      </div>

      {/* Content area */}
      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Main */}
        <main className="md:col-span-2">
          {tab === 'Overview' && (
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SectionTitle>About this Book</SectionTitle>
              <p className="text-sm leading-6 text-gray-900 dark:text-gray-100">{book.description}</p>
              {book.tags?.length ? <div className="mt-4 flex flex-wrap gap-2">{book.tags.map((t) => <Chip key={t}>#{t}</Chip>)}</div> : null}

              {(book.curators?.length || book.collections?.length) ? (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {book.curators?.length ? (
                    <div>
                      <SectionTitle>Curated by</SectionTitle>
                      <ul className="space-y-2">
                        {book.curators.map((c) => (
                          <li key={c.id} className="text-sm text-gray-900 dark:text-gray-100">
                            {c.name}
                            {c.role ? ` — ${c.role}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {book.collections?.length ? (
                    <div>
                      <SectionTitle>Collections</SectionTitle>
                      <div className="flex flex-wrap gap-2">{book.collections.map((s) => <Chip key={s}>{s}</Chip>)}</div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </motion.section>
          )}

          {tab === 'TOC' && (
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SectionTitle>Table of Contents</SectionTitle>
              <TocTree nodes={book.sections ?? []} />
            </motion.section>
          )}

          {tab === 'Annotations' && (
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SectionTitle right={<button className="text-xs text-gray-500 hover:underline">View all</button>}>Highlights & Notes</SectionTitle>
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="rounded-xl border border-gray-300 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                    <p className="text-sm text-gray-900 dark:text-gray-100">“Food is medicine when harmonized with Rutu (season), Desha (place), and Prakruti (constitution).”</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>Book · p.{10 + i}</span>
                      <span>by Medhāyu Scholar</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {tab === 'Metadata' && (
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SectionTitle>Bibliographic Details</SectionTitle>
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {Object.entries(book.meta ?? {}).map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-white p-3 ring-1 ring-gray-300 dark:bg-gray-900 dark:ring-gray-700">
                    <dt className="text-xs uppercase tracking-wide text-gray-600 dark:text-gray-400">{k}</dt>
                    <dd className="text-sm text-gray-900 dark:text-gray-100">{Array.isArray(v) ? v.join(', ') : String(v)}</dd>
                  </div>
                ))}
              </dl>

              {book.links?.length ? (
                <div className="mt-6">
                  <SectionTitle>Links</SectionTitle>
                  <ul className="list-inside list-disc text-sm text-gray-900 dark:text-gray-100">
                    {book.links.map((l) => (
                      <li key={l.href}>
                        <a className="hover:underline" href={l.href} target="_blank" rel="noreferrer">
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </motion.section>
          )}

          {tab === 'Related' && (
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SectionTitle>Related Books</SectionTitle>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                  <a key={i} href="#" className="group block">
                    <div className="overflow-hidden rounded-lg border border-gray-300 bg-white shadow-sm transition group-hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
                      <div className="aspect-[3/4] w-full bg-gray-100 dark:bg-gray-800" />
                      <div className="p-2">
                        <p className="line-clamp-2 text-xs font-medium text-gray-900 group-hover:underline dark:text-gray-100">Related Title {i}</p>
                        <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-400">Author Name</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </motion.section>
          )}
        </main>

        {/* Sidebar */}
        <aside className="md:sticky md:top-6 md:h-max">
          <div className="rounded-2xl border border-gray-300 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/60">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Quick Info</h3>
            <dl className="mt-3 space-y-2 text-sm">
              {book.meta?.publisher ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-600 dark:text-gray-400">Publisher</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{book.meta.publisher}</dd>
                </div>
              ) : null}
              {book.meta?.publishedOn ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-600 dark:text-gray-400">Published</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{book.meta.publishedOn}</dd>
                </div>
              ) : null}
              {book.meta?.isbn13 ? (
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-600 dark:text-gray-400">ISBN‑13</dt>
                  <dd className="text-gray-900 dark:text-gray-100">{book.meta.isbn13}</dd>
                </div>
              ) : null}
              {book.meta?.categories?.length ? (
                <div>
                  <dt className="text-gray-600 dark:text-gray-400">Categories</dt>
                  <dd className="mt-1 flex flex-wrap gap-2">{book.meta.categories!.map((c) => <Chip key={c}>{c}</Chip>)}</dd>
                </div>
              ) : null}
            </dl>

            {/* Secondary Actions */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800">Download</button>
              <button className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800">Share</button>
              <button className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800">Report</button>
              <button className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800">Wishlist</button>
            </div>
          </div>

          {/* Cite Box */}
          <div className="mt-4 rounded-2xl border border-gray-300 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/60">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">How to cite</h3>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-900 dark:bg-gray-800 dark:text-gray-100">{`${book.contributors?.[0]?.name ?? 'Author'}. ${book.title}. ${book.meta?.publisher ?? 'Vaikhari'}, ${book.meta?.publishedOn ?? 'n.d.'}.`}</pre>
            <button
              className="mt-2 w-full rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              onClick={() => navigator.clipboard?.writeText(`${book.contributors?.[0]?.name ?? 'Author'}. ${book.title}. ${book.meta?.publisher ?? 'Vaikhari'}, ${book.meta?.publishedOn ?? 'n.d.'}.`)}
            >
              Copy
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Demo Data
const demoBook: Book = {
  id: 'osh-0001',
  slug: 'ashtanga-hridaya',
  title: 'Aṣṭāṅga Hṛdaya',
  subtitle: 'A Classical Treatise on Ayurveda',
  description:
    'A foundational text synthesizing the wisdom of the Caraka and Suśruta traditions, offering practical guidance on health, disease, diagnosis, and therapy. This Vaikhari edition aligns verses with curated commentary, cross‑links to Chikitsa rules, and seasonal dietetics.',
  bannerUrl: '',
  coverUrl: '',
  gradient: '',
  contributors: [
    { id: 'p1', name: 'Vāgbhaṭa', role: 'Author' },
    { id: 'p2', name: 'Kalpatantra Vaidya Gurukula', role: 'Commentary' },
  ],
  curators: [{ id: 'c1', name: 'Medhāyu Team', role: 'Vaikhari Curator' }],
  links: [
    { label: 'Open in Reader', href: '#' },
    { label: 'Publisher', href: '#' },
  ],
  sections: [
    { id: 's1', title: 'Sūtrasthāna', children: [{ id: 's1-1', title: 'Ayuskāmiya Adhyaya' }, { id: 's1-2', title: 'Dīrghāyu Tantra' }] },
    { id: 's2', title: 'Śārīrasthāna' },
    { id: 's3', title: 'Cikitsāsthāna' },
  ],
  tags: ['Ayurveda', 'Samhita', 'Classical', 'Chikitsa'],
  meta: {
    language: 'Sanskrit',
    script: 'Devanāgarī',
    edition: 'Vaikhari Annotated',
    publisher: 'Kalpatantra · Oshadham',
    publishedOn: '2025',
    isbn13: '978-1-4028-9462-6',
    pages: 624,
    binding: 'Digital',
    categories: ['Ayurveda', 'Shastra'],
  },
  rating: 4.8,
  ratingCount: 218,
  readingTime: '8–12h',
  wordCount: 210000,
  collections: ['Medhāyu · Core Sūtra', 'Gurukula Curriculum'],
};

