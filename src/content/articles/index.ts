import type { Article } from '@/lib/articles'
import costToKeepAnAppRunning from './cost-to-keep-an-app-running'
import howAQuoteWorks from './how-a-quote-works'
import websiteOrApp from './website-or-app'

/**
 * Every article on the site, Guides and From the field (T-388). Add a new one
 * by writing its file in this folder and listing it here; docs/adding-an-article.md
 * has the format. The order only matters for articles with the same date
 * (earlier in the list shows first).
 */
export const ARTICLES: Article[] = [
  websiteOrApp,
  howAQuoteWorks,
  costToKeepAnAppRunning,
]
