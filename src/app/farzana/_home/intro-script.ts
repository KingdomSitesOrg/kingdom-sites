/**
 * Runs before the first paint, from a plain script tag at the top of the
 * Farzana layout. It decides whether the front page's logo writes itself (see
 * `intro.tsx`) and sets `data-intro="play"` on <html>, so the bar's finished
 * logo is already hidden when the page first draws and never flashes.
 *
 * It plays only on `/farzana`, never under reduced motion, and once per browser
 * session — the same session key `WordmarkIntro` writes when the logo plays.
 * `/farzana?intro` forgets that it has played and plays it again, for looking at it. A
 * safety timer shows the bar's logo anyway if the script bundle never
 * arrives, so the bar is never left without one.
 *
 * Kept out of the client file on purpose: a server layout that imports a value
 * from a "use client" module gets a reference to it, not the string.
 */
const SESSION_KEY = "farzana:wordmark-intro-played";

export const INTRO_SCRIPT = `(function(){try{var d=document.documentElement;if(location.pathname.replace(/\\/$/,"")!=="/farzana")return;if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;if(/[?&]intro\\b/.test(location.search))sessionStorage.removeItem("${SESSION_KEY}");else if(sessionStorage.getItem("${SESSION_KEY}")==="1")return;d.dataset.intro="play";setTimeout(function(){if(d.dataset.intro==="play")d.dataset.intro="landed"},12000)}catch(e){}})();`;
