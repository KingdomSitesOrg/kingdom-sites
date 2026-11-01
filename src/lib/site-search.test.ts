import { describe, expect, it } from 'vitest'
import { fold, mark, search, termsOf, type SearchIndex, type SearchPage } from '@/lib/site-search'

/* Site search (T-391): what a visitor types finds the right pages, in a sensible order. */

const page = (p: Partial<SearchPage> & { u: string; t: string }): SearchPage => ({ s: 'Studio', d: '', h: [], b: '', ...p })

const INDEX: SearchIndex = {
  v: 1,
  pages: [
    page({ u: '/', t: 'Kingdom Sites', s: 'Home', b: 'I build websites and apps for businesses, churches and anyone who needs software.' }),
    page({ u: '/portfolio', t: 'Portfolio', s: 'Portfolio', h: ['Farzana Classroom', 'JAM Legio', 'Ruta'], b: 'Education software, software for landscapers.' }),
    page({ u: '/jam-legio', t: 'JAM Legio', s: 'Portfolio', d: 'A Latin game.', b: 'March from Rōma to Gallia. Learn real Latin on the way.' }),
    page({ u: '/churches', t: 'Websites and apps for churches', s: 'Who I work with', b: 'Giving, sermons and a church app.' }),
    page({ u: '/privacy', t: 'Privacy Policy', s: 'Legal', l: 1, d: 'How Kingdom Sites handles your data, including churches.' }),
  ],
}

const urls = (q: string) => search(INDEX, q).map((r) => r.url)
const text = (pieces: { text: string }[]) => pieces.map((p) => p.text).join('')

describe('site search', () => {
  it('finds a word at the start of a word, in any case and without accents', () => {
    expect(urls('LATIN')).toEqual(['/jam-legio'])
    expect(urls('roma')).toEqual(['/jam-legio'])
    expect(urls('leg')).toEqual(['/jam-legio', '/portfolio'])
    expect(urls('atin')).toEqual([])
  })

  it('puts a title match above a heading match', () => {
    expect(urls('legio')[0]).toBe('/jam-legio')
    expect(urls('legio')).toContain('/portfolio')
  })

  it('needs every word, but leaves out small words', () => {
    expect(urls('church app')).toEqual(['/churches', '/'])
    expect(urls('church ruta')).toEqual([])
    expect(termsOf('How much does an app cost?')).toEqual(['much', 'app', 'cost'])
    expect(termsOf('the')).toEqual(['the'])
  })

  it('finds plurals from the singular and the singular from plurals', () => {
    expect(urls('churches')).toContain('/churches')
    expect(urls('apps')).toContain('/churches')
  })

  it('finds legal pages by their title only', () => {
    expect(urls('privacy')).toEqual(['/privacy'])
    expect(urls('data')).toEqual([])
    expect(urls('churches')).not.toContain('/privacy')
  })

  it('shows a snippet around the match with the match marked', () => {
    const [hit] = search(INDEX, 'gallia')
    expect(text(hit.snippet)).toContain('Gallia')
    expect(hit.snippet.find((p) => p.hit)?.text).toBe('Gallia')
    expect(hit.title.every((p) => !p.hit)).toBe(true)
    expect(hit.section).toBe('Portfolio')
  })

  it('cuts a long text down around the first match', () => {
    const long: SearchIndex = { v: 1, pages: [page({ u: '/x', t: 'X', b: `${'word '.repeat(200)}needle ${'word '.repeat(200)}` })] }
    const [hit] = search(long, 'needle')
    const shown = text(hit.snippet)
    expect(shown.length).toBeLessThan(200)
    expect(shown.startsWith('…')).toBe(true)
    expect(shown.endsWith('…')).toBe(true)
    expect(shown).toContain('needle')
  })

  it('returns nothing for nothing typed', () => {
    expect(search(INDEX, '   ')).toEqual([])
    expect(search(INDEX, '?!')).toEqual([])
  })

  it('keeps folded text the same length as the original, so marks line up', () => {
    const s = 'Rōma — ﬁne Ångström'
    expect(fold(s).length).toBe(s.length)
    expect(text(mark(s, ['angstrom']))).toBe(s)
    expect(mark(s, ['angstrom']).find((p) => p.hit)?.text).toBe('Ångström')
  })
})
