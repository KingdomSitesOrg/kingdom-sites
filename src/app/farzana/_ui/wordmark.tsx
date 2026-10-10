import { Diamond } from "./diamond";
import { cn } from "./cn";

/**
 * The Farzana logo as live text: "Farzana" in Reem Kufi 500, with the two
 * saffron diamonds over the z. Used in product headers wherever the product
 * name appears. It ships no browser code.
 *
 * The animated version for the public home hero is `WordmarkIntro`, re-exported
 * from here and kept in its own file because it runs in the browser.
 *
 * Geometry, from the brand guidelines ("Logo"):
 * - each diamond's side is 11% of the F's cap height, so it is 15.6% tip to tip;
 * - the gap between the two tips is half a diamond's width;
 * - the pair is centred on the z, with its lower tips sitting on the cap
 *   (ascender) line.
 * Everything is measured in `cap`, the browser's own cap-height unit, so it
 * holds whatever font is drawing. A browser without that unit uses Reem Kufi's
 * cap height, 0.729em.
 *
 * Size it with a text size in `className` (`text-3xl`). Keep the word at least
 * 96px wide — about a 25px text size; the box never goes narrower than that.
 */

export type WordmarkTone = "default" | "inverse" | "mono";

const TONES: Record<
  WordmarkTone,
  { word: string; diamond: string; tagline: string }
> = {
  /** Lapis on Mist or white, saffron diamonds. The primary version. */
  default: { word: "text-heading", diamond: "bg-gold", tagline: "text-muted" },
  /** Light on lapis or the dark ground. The tagline takes the dark-mode muted. */
  inverse: {
    word: "text-[#E6ECF1]",
    diamond: "bg-gold",
    tagline: "text-[#93A3B4]",
  },
  /** One colour throughout, diamonds included: stamps and one-colour print. */
  mono: { word: "text-heading", diamond: "bg-current", tagline: "" },
};

export function Wordmark({
  tone = "default",
  tagline = false,
  className,
}: {
  tone?: WordmarkTone;
  /** Shows "Intelligent, or learned, in Persian" centred below the word. */
  tagline?: boolean;
  /** Size (a text size) and placement. A text colour here recolours it. */
  className?: string;
}) {
  const colours = TONES[tone];

  return (
    <span
      // The logo never mirrors, even on a right-to-left page.
      dir="ltr"
      className={cn(
        "inline-flex min-w-24 flex-col items-center font-display [--cap:0.729em] supports-[width:1cap]:[--cap:1cap]",
        colours.word,
        className,
      )}
    >
      <span
        role="img"
        aria-label="Farzana"
        className="whitespace-nowrap font-medium leading-none"
      >
        Far
        <span className="relative inline-block">
          z
          {/*
           * A layer over the z that shares its baseline. The zero-size anchor
           * inside is centred on the z and lifted one cap height above the
           * baseline; the diamonds stand on it.
           */}
          <span className="absolute inset-0 text-center">
            <span className="relative inline-block h-0 w-0 [vertical-align:var(--cap)]">
              <span className="absolute bottom-0 left-0 flex -translate-x-1/2 gap-[calc(var(--cap)*0.0778)]">
                <Diamond
                  size="calc(var(--cap) * 0.1556)"
                  className={colours.diamond}
                />
                <Diamond
                  size="calc(var(--cap) * 0.1556)"
                  className={colours.diamond}
                />
              </span>
            </span>
          </span>
        </span>
        ana
      </span>
      {tagline ? (
        <span
          className={cn(
            "mt-1 text-[length:max(0.8125rem,0.15em)] font-normal leading-tight",
            colours.tagline,
          )}
        >
          Intelligent, or learned, in Persian
        </span>
      ) : null}
    </span>
  );
}

export { WordmarkIntro } from "./wordmark-intro";
