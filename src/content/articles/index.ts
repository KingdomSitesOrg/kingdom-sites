import type { Article } from '@/lib/articles'
import aiSuperintelligenceMyTake from './ai-superintelligence-my-take'
import buildingJamLegio from './building-jam-legio'
import costToKeepAnAppRunning from './cost-to-keep-an-app-running'
import howAQuoteWorks from './how-a-quote-works'
import howLongDoesAnAppTake from './how-long-does-an-app-take'
import kcupgTheNationsInKansasCity from './kcupg-the-nations-in-kansas-city'
import newClaudeModelsWhatTheyMean from './new-claude-models-what-they-mean'
import ownYourCodeAndAccounts from './own-your-code-and-accounts'
import prayingForBangladesh from './praying-for-bangladesh'
import thePersecutedChurchToday from './the-persecuted-church-today'
import websiteOrApp from './website-or-app'
import whatIsAnMvp from './what-is-an-mvp'
import whyIMadeWhoWillTellThem from './why-i-made-who-will-tell-them'

/**
 * Every article on the site, all in Guides (T-388). Add a new one
 * by writing its file in this folder and listing it here; docs/adding-an-article.md
 * has the format. The order only matters for articles with the same date
 * (earlier in the list shows first).
 */
export const ARTICLES: Article[] = [
  websiteOrApp,
  howAQuoteWorks,
  costToKeepAnAppRunning,
  whatIsAnMvp,
  whyIMadeWhoWillTellThem,
  aiSuperintelligenceMyTake,
  thePersecutedChurchToday,
  newClaudeModelsWhatTheyMean,
  prayingForBangladesh,
  howLongDoesAnAppTake,
  kcupgTheNationsInKansasCity,
  ownYourCodeAndAccounts,
  buildingJamLegio,
]
