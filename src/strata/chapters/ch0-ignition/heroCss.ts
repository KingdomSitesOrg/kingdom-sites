/**
 * The write-on, CSS only, from first paint: every stroke is laid three times (layers lag 0.15 s and 0.30 s),
 * each layer hot when laid and cooling, under a blurred molten glow that fades behind the dot. Inlined into the
 * server HTML by the Overlay (the project's Turbopack CSS rule turns CSS modules global, so names are prefixed).
 */
export const HERO_CSS = `
.ig-svg{overflow:visible;fill:none;stroke-linecap:round;stroke-linejoin:round;--pearl:#ece7df;--shade-1:#5d5953;--shade-2:#a29d95}
.ig-svg use{stroke-width:var(--w,2);stroke-dasharray:1 2}
.ig-glow use{stroke:var(--molten);stroke-width:calc(var(--w,2) + 1.4);opacity:0;animation:ig-draw var(--d) linear var(--t) both,ig-glow .3s cubic-bezier(.2,.6,.3,1) var(--t) both}
.ig-l1 use{stroke:var(--shade-1);animation:ig-draw var(--d) linear var(--t) both,ig-cool1 .3s linear var(--t) both}
.ig-l2 use{stroke:var(--shade-2);animation:ig-draw var(--d) linear calc(var(--t) + .15s) both,ig-cool2 .32s ease-out calc(var(--t) + .15s) both}
.ig-l3 use{stroke:var(--pearl);animation:ig-draw var(--d) linear calc(var(--t) + .3s) both,ig-cool3 .36s ease-out calc(var(--t) + .3s) both}
@keyframes ig-draw{from{stroke-dashoffset:1.002}to{stroke-dashoffset:0}}
@keyframes ig-glow{0%{opacity:.85}100%{opacity:0}}
@keyframes ig-cool1{0%{stroke:var(--molten-core)}20%{stroke:var(--molten-hot)}50%{stroke:var(--molten)}100%{stroke:var(--molten-deep)}}
@keyframes ig-cool2{0%{stroke:var(--molten)}45%{stroke:var(--molten-deep)}100%{stroke:var(--shade-2)}}
@keyframes ig-cool3{0%{stroke:#e9a77a}50%{stroke:#efd3bb}100%{stroke:var(--pearl)}}
.ig-dot{offset-rotate:0deg;offset-distance:100%;animation:var(--dot-path) 2.6s linear both}
.ig-dot-core{transform-box:fill-box;transform-origin:center;animation:ig-ignite .32s cubic-bezier(.16,1,.3,1) .28s both,ig-ember 2.4s ease-in-out 2.6s infinite}
@keyframes ig-ignite{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
@keyframes ig-ember{0%,100%{opacity:1}50%{opacity:.82}}
.ig-drip{animation:ig-drip 1.8s cubic-bezier(.55,0,.45,1) 2.6s infinite both}
@keyframes ig-drip{0%{transform:translateY(-2px) scale(.6);opacity:0}18%{transform:translateY(0) scale(1);opacity:1}82%{opacity:1}100%{transform:translateY(43px) scale(.8);opacity:0}}
@media (prefers-reduced-motion:reduce){
.ig-svg use,.ig-dot,.ig-dot-core,.ig-drip{animation:none!important}
.ig-svg use{stroke-dashoffset:0}
.ig-glow{display:none}
}
`;
