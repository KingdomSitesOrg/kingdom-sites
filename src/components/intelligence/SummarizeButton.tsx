'use client'

import { SUMMARIZE_EVENT, Spark, type SummarizeRequest } from './Intelligence'

/**
 * "Summarize this article" on a guide or blog post (T-388). It asks the
 * floating Intelligence chat (on every studio page) to open and sum up this
 * article; the chat sends the article's path, and the route reads its text.
 */
export default function SummarizeButton({ path, title }: SummarizeRequest) {
  return (
    <button
      type="button"
      className="cn-ghost ki-summarize"
      onClick={() => window.dispatchEvent(new CustomEvent<SummarizeRequest>(SUMMARIZE_EVENT, { detail: { path, title } }))}
    >
      <Spark />
      Summarize this article
    </button>
  )
}
