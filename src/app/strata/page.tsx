import { Story } from '@/strata/story/Story';
import SaasPage from '@/strata/saas/SaasPage';
import Footer from '@/strata/saas/footer';
import { PhaseRail } from '@/strata/hud/PhaseRail';
import { ConceptLabel } from '@/strata/ConceptLabel';

export default function StrataPage() {
  return (
    <>
      {/* STORYBOARD 5.2: the first focusable element, visible only when focused. */}
      <a
        href="#customers"
        className="sr-only-focusable fixed left-4 top-4 z-overlay rounded-lg bg-bg-3 px-4 py-3 text-ui text-text-1"
      >
        Skip the story
      </a>
      {/* AppShell already wraps the page in <main>. */}
      <div className="w-full overflow-x-clip">
        <PhaseRail />
        <Story />
        <SaasPage />
      </div>
      <div className="relative z-10 bg-bg-0">
        <Footer />
      </div>
      <ConceptLabel />
    </>
  );
}
