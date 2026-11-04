import Customers from './customers';
import Features from './features';
import HowItWorks from './how-it-works';
import Quote from './quote';
import Metrics from './metrics';
import Testimonials from './testimonials';
import Pricing from './pricing';
import Faq from './faq';
import Start from './start';

/**
 * Normal-flow sections after the story. The wrapper is positioned above the fixed story canvas and
 * opaque, and the canvas stops rendering once the story has scrolled away. The footer is rendered by the
 * page after <main>, so it is the contentinfo landmark.
 */
export default function SaasPage() {
  return (
    <div className="relative z-10 bg-bg-0">
      <Customers />
      <Features />
      <HowItWorks />
      <Quote />
      <Metrics />
      <Testimonials />
      <Pricing />
      <Faq />
      <Start />
    </div>
  );
}
