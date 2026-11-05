// Archivo, the site's typeface. The site loads it from Google Fonts through
// next/font, so there is no file in the repo; this is the same face the Blender
// kit uses (blender/assets/fonts/Archivo-SemiBold.ttf, the variable font
// instanced at weight 650), copied to public/fonts. Every frame waits for it,
// and a face that fails to load stops the render, so no frame is ever drawn in
// a fallback. Never italics.

import { loadFont } from "@remotion/fonts";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

export const ARCHIVO = "Archivo";

let ready: Promise<void> | null = null;

/** Loads the face once; rejects if it is not usable. */
export function loadFilmFonts(): Promise<void> {
  if (ready) return ready;
  ready = loadFont({ family: ARCHIVO, url: staticFile("fonts/Archivo-SemiBold.ttf"), weight: "600", display: "block" }).then(() => {
    if (!document.fonts.check(`600 40px "${ARCHIVO}"`)) {
      throw new Error("fonts: Archivo did not load; a frame would fall back");
    }
  });
  return ready;
}

/** Holds the render until the font is in; fails it if it never is. */
export function waitForFonts(): void {
  const handle = delayRender("Archivo");
  loadFilmFonts().then(
    () => continueRender(handle),
    (err) => cancelRender(err),
  );
}
