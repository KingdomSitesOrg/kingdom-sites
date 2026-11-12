import type { Metadata } from 'next'
import CaseStudy from '@/components/cinematic/CaseStudy'
import { CASE_STUDIES } from '@/lib/case-studies'
import { caseStudyLd, shareCard } from '@/lib/seo'

const study = CASE_STUDIES.sign

export const metadata: Metadata = {
  title: study.title,
  description: study.description,
  alternates: { canonical: study.path },
  // Kept out of search, as the project's own page is (Thomas, T-534).
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  ...shareCard(study.shareTitle, study.description, study.path, {
    url: study.shareImage,
    width: 1200,
    height: 630,
    alt: study.shareTitle,
  }),
}

export default function Page() {
  return <CaseStudy study={study} data={caseStudyLd(study)} />
}
