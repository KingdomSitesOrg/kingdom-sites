/**
 * Rochester, MN geo helpers (blog, schema where still used).
 * Local SEO is no longer the main product — see /seo for the quiet side page.
 * This is place naming for content/geo meta — not a commercial funnel.
 */

export const SERVICE_CITY = 'Rochester'
export const SERVICE_REGION = 'Minnesota'
export const SERVICE_REGION_CODE = 'MN'
export const SERVICE_COUNTRY = 'US'
export const SERVICE_AREA_LABEL = 'Rochester, MN and Southeast Minnesota'

/** Downtown Rochester approximate centre — used only for geo meta / schema. */
export const SERVICE_LAT = 44.0121
export const SERVICE_LNG = -92.4802

export const AREA_SERVED = [
  { '@type': 'City' as const, name: 'Rochester', containedInPlace: { '@type': 'State' as const, name: 'Minnesota' } },
  { '@type': 'AdministrativeArea' as const, name: 'Olmsted County' },
  { '@type': 'AdministrativeArea' as const, name: 'Southeast Minnesota' },
]

/** Keywords aimed at owners searching for growth, clients, and local visibility. */
export const LOCAL_KEYWORDS = [
  'grow local business Rochester MN',
  'get more clients Rochester Minnesota',
  'small business marketing Rochester MN',
  'local SEO Rochester MN',
  'website for Rochester MN business',
  'Google Business Profile Rochester',
  'find customers Rochester MN',
  'growing a service business Minnesota',
  'Rochester MN small business website',
  'get found on Google Rochester',
  'local business growth Southeast Minnesota',
]
