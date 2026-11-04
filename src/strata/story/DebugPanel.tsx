'use client';

import { useRef } from 'react';
import { director } from './director';
import { useStoryTick } from './hooks';
import { storyStore } from './store';

/** ?debug=1 stats panel, updated a few times a second straight into the DOM. */
export function DebugPanel() {
  const out = useRef<HTMLPreElement>(null);
  const frame = useRef(0);

  useStoryTick(() => {
    if (frame.current++ % 12 || !out.current) return;
    const s = storyStore.getState();
    const i = s.active;
    const pr = director.progress(i);
    const st = director.stats;
    const h = director.handoff;
    out.current.textContent = [
      `fps      ${st.fps.toFixed(1)}`,
      `chapter  ${i} ${director.defs[i]?.id ?? ''}`,
      `p ${pr.p.toFixed(3)}  raw ${pr.raw.toFixed(3)}`,
      `enter ${pr.enter.toFixed(2)}  exit ${pr.exit.toFixed(2)}`,
      `handoff  ${h.active ? `${h.outgoing}->${h.incoming} ${h.style} t ${h.t.toFixed(2)}` : '-'}`,
      `mode ${s.mode}  tier ${s.quality}  dpr ${st.dpr.toFixed(2)}`,
      `draws ${st.drawCalls}  tris ${st.triangles.toLocaleString('en-US')}`,
      `geo ${st.geometries}  tex ${st.textures}`,
    ].join('\n');
  });

  return (
    <pre
      ref={out}
      data-debug
      aria-hidden
      className="pointer-events-none fixed bottom-3 left-3 z-[100] rounded-md border border-line bg-bg-0/90 px-3 py-2 font-mono text-[11px] leading-4 text-ok"
    />
  );
}
