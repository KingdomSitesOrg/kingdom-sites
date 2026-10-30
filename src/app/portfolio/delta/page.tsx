import type { Metadata } from 'next'
import CaseStudy from '@/components/cinematic/CaseStudy'
import { CASE_STUDIES } from '@/lib/case-studies'
import { DELTA_LD, shareCard } from '@/lib/seo'

const study = CASE_STUDIES.delta

export const metadata: Metadata = {
  title: study.title,
  description: study.description,
  alternates: { canonical: study.path },
  ...shareCard(study.shareTitle, study.description, study.path, {
    url: study.shareImage,
    width: 1200,
    height: 630,
    alt: study.shareTitle,
  }),
}

export default function Page() {
  return <CaseStudy study={study} data={DELTA_LD} />
}
