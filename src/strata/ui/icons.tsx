import type { ReactNode, SVGProps } from "react";
import { cn } from "./cn";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  size?: number;
  /** Give a title only when the icon carries meaning on its own; otherwise it is aria-hidden. */
  title?: string;
};

function make(name: string, body: ReactNode) {
  function Icon({ size = 24, title, className, strokeWidth = 1.5, ...rest }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        role={title ? "img" : undefined}
        aria-hidden={title ? undefined : true}
        aria-label={title}
        focusable="false"
        className={cn("shrink-0", className)}
        {...rest}
      >
        {body}
      </svg>
    );
  }
  Icon.displayName = name;
  return Icon;
}

/* Feature icons (24 px grid, 1.5 px stroke). */

export const IconAiModel = make(
  "IconAiModel",
  <>
    <path d="M10.5 6.2 16.6 9.7v7L10.5 20.2 4.4 16.7v-7Z" />
    <path d="m4.4 9.7 6.1 3.5 6.1-3.5M10.5 13.2v7" />
    <path d="M19 2.8c.25 1.35.8 1.9 2.2 2.2-1.4.3-1.95.85-2.2 2.2-.25-1.35-.8-1.9-2.2-2.2 1.4-.3 1.95-.85 2.2-2.2Z" />
  </>,
);

export const IconOptimize = make(
  "IconOptimize",
  <>
    <circle cx="12" cy="19.5" r="1.6" />
    <circle cx="5.5" cy="5" r="1.6" />
    <circle cx="18.5" cy="5" r="1.6" />
    <circle cx="12" cy="11.5" r="1.3" />
    <path d="M12 17.9v-5.1M11 10.6C9.2 9.2 7.4 8.4 6.4 6.4M13 10.6c1.8-1.4 3.6-2.2 4.6-4.2" />
    <path d="M3.5 13.5c2.6-.9 4.4-.5 6.1.9M20.5 13.5c-2.6-.9-4.4-.5-6.1.9" />
  </>,
);

export const IconQuote = make(
  "IconQuote",
  <>
    <path d="M3.5 12V4.5a1 1 0 0 1 1-1H12l8.2 8.2a1.1 1.1 0 0 1 0 1.6l-7 7a1.1 1.1 0 0 1-1.6 0Z" />
    <circle cx="8" cy="8" r="1.3" />
    <path d="m14 9.8-2.4 3.6h3.2l-2.4 3.6" />
  </>,
);

export const IconFleet = make(
  "IconFleet",
  <>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    <path d="M3.5 6h7M13.5 6h7M3.5 16h7M13.5 16h7M7 6v1.6M17 6v1.6M7 16v1.6M17 16v1.6" />
  </>,
);

export const IconMaterial = make(
  "IconMaterial",
  <>
    <circle cx="10.5" cy="12" r="7.5" />
    <circle cx="10.5" cy="12" r="2.2" />
    <path d="M10.5 4.5a7.5 7.5 0 0 1 0 15M6 8.4a5.4 5.4 0 0 1 4.5-1.9" />
    <path d="M18 12c2 0 3 1.1 3 3v5.5" />
  </>,
);

export const IconApi = make(
  "IconApi",
  <>
    <path d="M8 4c-2 0-2.6 1-2.6 3v2.1c0 1.5-.7 2.4-2 2.9 1.3.5 2 1.4 2 2.9V17c0 2 .6 3 2.6 3" />
    <path d="M16 4c2 0 2.6 1 2.6 3v2.1c0 1.5.7 2.4 2 2.9-1.3.5-2 1.4-2 2.9V17c0 2-.6 3-2.6 3" />
    <path d="M9.5 12h5M12.5 9.5 15 12l-2.5 2.5" />
  </>,
);

/* Story + UI icons. */

export const IconLayers = make(
  "IconLayers",
  <>
    <path d="M12 3.5 20.5 8 12 12.5 3.5 8Z" />
    <path d="m3.5 12 8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5" />
  </>,
);

export const IconNozzle = make(
  "IconNozzle",
  <>
    <rect x="7.5" y="3" width="9" height="5.5" rx="1" />
    <path d="M9.5 8.5h5l-1.3 4.5h-2.4ZM12 13v1.8" />
    <path d="M4.5 20.5h15M7 17.8h10" />
  </>,
);

export const IconCube = make(
  "IconCube",
  <>
    <path d="M12 3.5 19.5 7.8v8.4L12 20.5l-7.5-4.3V7.8Z" />
    <path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12.1v8.4" />
  </>,
);

export const IconSparkle = make(
  "IconSparkle",
  <path d="M12 3.5c.6 3.7 1.9 5 5.6 5.6-3.7.6-5 1.9-5.6 5.6-.6-3.7-1.9-5-5.6-5.6 3.7-.6 5-1.9 5.6-5.6ZM18.5 15.5c.3 1.6.9 2.2 2.5 2.5-1.6.3-2.2.9-2.5 2.5-.3-1.6-.9-2.2-2.5-2.5 1.6-.3 2.2-.9 2.5-2.5Z" />,
);

export const IconThermometer = make(
  "IconThermometer",
  <>
    <path d="M14 14.3V5a2 2 0 1 0-4 0v9.3a3.5 3.5 0 1 0 4 0Z" />
    <path d="M12 9v7.5M17 6h2.5M17 9h2.5M17 12h2.5" />
  </>,
);

export const IconClock = make(
  "IconClock",
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </>,
);

export const IconArrowRight = make("IconArrowRight", <path d="M5 12h14M13 6l6 6-6 6" />);
export const IconArrowUpRight = make("IconArrowUpRight", <path d="M7 17 17 7M8.5 7H17v8.5" />);
export const IconArrowDown = make("IconArrowDown", <path d="M12 5v14M6 13l6 6 6-6" />);
export const IconCheck = make("IconCheck", <path d="m5 12.5 4.5 4.5L19 7.5" />);
export const IconPlus = make("IconPlus", <path d="M12 5v14M5 12h14" />);
export const IconMinus = make("IconMinus", <path d="M5 12h14" />);
export const IconChevronDown = make("IconChevronDown", <path d="m6 9 6 6 6-6" />);
export const IconPlay = make("IconPlay", <path d="M8 5.5v13l10.5-6.5Z" />);
export const IconMail = make(
  "IconMail",
  <>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </>,
);
export const IconX = make("IconX", <path d="M4.5 4.5h4l11 15h-4ZM19.5 4.5l-6.2 6.6M4.5 19.5l6.2-6.6" />);
export const IconLinkedIn = make(
  "IconLinkedIn",
  <>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3" />
    <path d="M8 10.5v6M8 7.5v.01M11.5 16.5v-6M11.5 13c0-1.6 1-2.7 2.5-2.7s2.5 1 2.5 2.7v3.5" />
  </>,
);
export const IconGitHub = make(
  "IconGitHub",
  <path d="M9 19c-4 1.3-4-2-5.6-2.5M14.6 21v-3.1a2.7 2.7 0 0 0-.8-2.1c2.6-.3 5.4-1.3 5.4-5.8a4.5 4.5 0 0 0-1.2-3.1 4.2 4.2 0 0 0-.1-3.1s-1-.3-3.3 1.2a11.3 11.3 0 0 0-6 0C6.3 2.5 5.3 2.8 5.3 2.8a4.2 4.2 0 0 0-.1 3.1A4.5 4.5 0 0 0 4 9c0 4.5 2.8 5.5 5.4 5.8a2.7 2.7 0 0 0-.8 2.1V21" />,
);
export const IconYouTube = make(
  "IconYouTube",
  <>
    <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
    <path d="M10.5 9.5v5l4.2-2.5Z" />
  </>,
);
