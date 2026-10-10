/**
 * Runs before the first paint, as the first thing inside the page's wrapper:
 * puts the visitor's saved light or dark choice on `.farzana[data-theme]`, or
 * light when there is none. Kept out of the client file on purpose: a server
 * layout importing a value from a "use client" module gets a reference, not
 * the string.
 */
export const THEME_KEY = 'farzana-public-theme'

export const THEME_SCRIPT = `(function(){try{var w=document.currentScript&&document.currentScript.parentElement;if(!w)return;var t=localStorage.getItem("${THEME_KEY}");w.dataset.theme=t==="dark"?"dark":"light"}catch(e){}})();`
