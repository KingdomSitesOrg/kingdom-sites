import Image from 'next/image'
import { IPhone } from '@/components/cinematic/Frames'
import type { Article } from '@/lib/articles'
import { coverSvg } from '@/lib/covers'
import { SHOTS } from '@/lib/work'

/* An article's cover: its photo, real app screenshots side by side, or the
   picture drawn from its slug. */
export default function Cover({ article, priority = false, sizes }: { article: Article; priority?: boolean; sizes: string }) {
  const photo = article.cover
  if (article.phones) {
    /* The same card shape, a little smaller, with the phones in drawn iPhones; each screenshot is served at the width it is shown, never larger
       than the original (T-403). */
    return (
      <span className="mx-auto block w-[90%] overflow-hidden rounded-[12px] bg-surface shadow-[0_0_0_1px_rgba(255,255,255,0.07)]">
        <span className="flex aspect-[40/21] items-center justify-center gap-[4%]">
          {article.phones.shots.map((key) => (
            <span key={key} className="block w-[22%]">
              <IPhone shot={SHOTS[key]} eager={priority} sizes="(min-width: 900px) 165px, 20vw" />
            </span>
          ))}
        </span>
      </span>
    )
  }
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
