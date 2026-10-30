/**
 * Site search (T-391): finds pages in the index scripts/search-index.mjs
 * writes at build time (public/search-index.json). Every word typed has to be
 * found on a page, at the start of a word there ("app" finds "apps"); small
 * words like "how" and "the" are left out unless nothing else was typed. A
 * hit in the title counts most (a whole word there more than the start of
 * one), then a heading, the description, the text.
 * Legal pages are found by their title only.
 */

export type SearchPage = {
  /** Address. */
  u: string
  /** Title. */
  t: string
  /** Section label. */
  s: string
  /** Description. */
  d: string
  /** Headings. */
  h: string[]
  /** Main text. */
  b: string
  /** A legal page: found by its title only. */
  l?: 1
}

export type SearchIndex = { v: 1; pages: SearchPage[] }

/** A run of text, and whether it is one of the words searched for. */
export type Piece = { text: string; hit: boolean }

export type SearchResult = { url: string; section: string; title: Piece[]; snippet: Piece[] }

const STOP = new Set(
  'a an and are as at be but by can could do does for from get got has have how i if in into is it its me my of on or our so than that the their them then there these this to was we were what when where which who why will with would you your'.split(
    ' ',
  ),
)

/** Lower case without accents, one character for one (Rōma is roma), so places found line up with the original text. */
export function fold(text: string) {
  let out = ''
  for (const c of text) {
    const plain = c.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    out += plain.length === c.length ? plain : c.toLowerCase().length === c.length ? c.toLowerCase() : c
  }
  return out
}

/** "churches" looks for "church…", "apps" for "app…"; "business" stays. */
function stem(word: string) {
  if (word.length > 4 && word.endsWith('es')) return word.slice(0, -2)
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1)
  return word
}

/** The words to look for in what was typed. */
export function termsOf(query: string) {
  const words = fold(query).split(/[^a-z0-9À-￿]+/).filter(Boolean)
  const kept = words.filter((w) => !STOP.has(w))
  return [...new Set((kept.length ? kept : words).map(stem))].slice(0, 8)
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Where each term starts a word in `folded`, as [start, end] pairs in order. */
function hits(folded: string, terms: string[]) {
  const found: [number, number][] = []
  for (const term of terms) {
    const re = new RegExp(`(?:^|[^a-z0-9\\u00c0-\\uffff])(${escape(term)})`, 'g')
    for (let m = re.exec(folded); m; m = re.exec(folded)) {
      const start = m.index + m[0].length - term.length
      found.push([start, start + term.length])
      re.lastIndex = start + term.length
    }
  }
  return found.sort((a, b) => a[0] - b[0])
}

const has = (folded: string, term: string) => hits(folded, [term]).length > 0

/** "refer" is a whole word in "Refer someone", not in "referrals". */
const wholeWord = (folded: string, term: string) =>
  hits(folded, [term]).some(([, end]) => !/[a-z0-9\u00c0-\uffff]/.test(folded[end] ?? '') || folded.startsWith('s', end) || folded.startsWith('es', end))

/** Splits text into plain and searched-for runs. */
export function mark(text: string, terms: string[], from = 0, to = text.length): Piece[] {
  const pieces: Piece[] = []
  let at = from
  for (const [start, end] of hits(fold(text), terms)) {
    if (start < at || end > to) continue
    if (start > at) pieces.push({ text: text.slice(at, start), hit: false })
    pieces.push({ text: text.slice(start, end), hit: true })
    at = end
  }
  if (at < to) pieces.push({ text: text.slice(at, to), hit: false })
  return pieces
}

/** About two lines of text around the first place it matches. */
function snippet(text: string, terms: string[], length = 160): Piece[] {
  if (!text) return []
  const first = hits(fold(text), terms)[0]?.[0] ?? 0
  let start = Math.max(0, first - 50)
  if (start > 0) start = text.indexOf(' ', start) + 1 || start
  let end = Math.min(text.length, start + length)
  if (end < text.length) end = text.lastIndexOf(' ', end) > start ? text.lastIndexOf(' ', end) : end
  const pieces = mark(text, terms, start, end)
  if (start > 0) pieces.unshift({ text: '…', hit: false })
  if (end < text.length) pieces.push({ text: '…', hit: false })
  return pieces
}

type Folded = { page: SearchPage; title: string; headings: string; description: string; body: string }
const cache = new WeakMap<SearchIndex, Folded[]>()

function folded(index: SearchIndex) {
  let list = cache.get(index)
  if (!list) {
    list = index.pages.map((page) => ({
      page,
      title: fold(page.t),
      headings: fold(page.h.join(' · ')),
      description: fold(page.d),
      body: fold(page.b),
    }))
    cache.set(index, list)
  }
  return list
}

/** The pages that match, best first. */
export function search(index: SearchIndex, query: string, limit = 8): SearchResult[] {
  const terms = termsOf(query)
  if (!terms.length) return []
  const phrase = fold(query).trim()

  const scored: { score: number; at: number; result: SearchResult }[] = []
  folded(index).forEach((f, at) => {
    let score = 0
    for (const term of terms) {
      const inTitle = has(f.title, term)
      if (f.page.l && !inTitle) return
      const points =
        (inTitle ? 10 : 0) +
        (inTitle && wholeWord(f.title, term) ? 5 : 0) + (has(f.headings, term) ? 5 : 0) + (has(f.description, term) ? 3 : 0) + Math.min(3, hits(f.body, [term]).length)
      if (!points) return
      score += points
    }
    if (phrase.length > 2 && f.title.includes(phrase)) score += 8

    const source = !f.page.l && terms.some((t) => has(f.body, t)) ? f.page.b : f.page.d
    scored.push({
      score,
      at,
      result: { url: f.page.u, section: f.page.s, title: mark(f.page.t, terms), snippet: snippet(source, terms) },
    })
  })
  return scored
    .sort((a, b) => b.score - a.score || a.at - b.at)
    .slice(0, limit)
    .map((s) => s.result)
}
