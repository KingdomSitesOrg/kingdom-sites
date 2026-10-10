import { Closing, Film, Meaning, Switching } from './_home/closing'
import { Families } from './_home/families'
import { Features } from './_home/features'
import { Hero } from './_home/hero'
import { LogoIntro } from './_home/intro'
import { MeetThomas } from './_home/meet-thomas'
import { Steps } from './_home/steps'
import { Story } from './_home/story'

/**
 * The Farzana marketing page, hosted here until farzana.app has a home. Built
 * to get a teacher on a call with Thomas.
 *
 * It opens on the logo writing itself in its place at the start of the top
 * bar (once per session) while the page rises in. Then the story, top to
 * bottom: one line on what Farzana is, with the call to book; the scattered
 * tools pulling together into one place as the page scrolls; everything it
 * does; three steps; what students and parents see; switching from another
 * provider; what the name means; the film; Thomas, who you talk to on the
 * call; and the call to book once more.
 *
 * The same page lives in the Farzana app (KingdomSitesOrg/edu, `src/app/(site)`),
 * where it also carries Create account and Sign in.
 */
export default function FarzanaPage() {
  return (
    <main className="overflow-x-clip">
      <LogoIntro />
      <Hero />
      <Story />
      <Features />
      <Steps />
      <Families />
      <Switching />
      <Meaning />
      <Film />
      <MeetThomas />
      <Closing />
    </main>
  )
}
