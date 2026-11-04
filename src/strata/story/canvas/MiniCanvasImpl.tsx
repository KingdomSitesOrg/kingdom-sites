'use client';

import { Suspense, use, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import './threeConsole';

type Loader = () => Promise<{ default: ComponentType }>;
const loads = new WeakMap<Loader, Promise<{ default: ComponentType }>>();

function Content({ load }: { load: Loader }) {
  let p = loads.get(load);
  if (!p) loads.set(load, (p = load()));
  const { default: C } = use(p);
  return <C />;
}

export default function MiniCanvasImpl({
  content,
  active,
  camera,
  maxDpr,
  fallback,
}: {
  content: Loader;
  active: boolean;
  camera?: { position?: [number, number, number]; fov?: number };
  maxDpr: number;
  fallback: ReactNode;
}) {
  const [visibleTab, setVisibleTab] = useState(true);
  useEffect(() => {
    const on = () => setVisibleTab(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);

  return (
    <Canvas
      frameloop={active && visibleTab ? 'always' : 'never'}
      dpr={[1, maxDpr]}
      camera={{ position: camera?.position ?? [0, 0, 4], fov: camera?.fov ?? 35 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'default' }}
      fallback={fallback}
      style={{ position: 'absolute', inset: 0 }}
      aria-hidden
    >
      <Suspense fallback={null}>
        <Content load={content} />
      </Suspense>
    </Canvas>
  );
}
