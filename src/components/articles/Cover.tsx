import Image from 'next/image'
import type { Article } from '@/lib/articles'
import { coverSvg } from '@/lib/covers'

/* An article's cover: its photo, or the picture drawn from its slug. */
export default function Cover({ article, priority = false, sizes }: { article: Article; priority?: boolean; sizes: string }) {
  const photo = article.cover
  return (
    <span className="block aspect-[40/21] overflow-hidden rounded-[12px] bg-surface shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
      {photo ? (
        <Image
          src={photo.photo}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          sizes={sizes}
          priority={priority}
          className="h-full w-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="block h-full w-full [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: coverSvg(article.slug, article.section) }}
        />
      )}
    </span>
  )
}
