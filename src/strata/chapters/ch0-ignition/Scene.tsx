'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Color, PlaneGeometry, Vector3, type Group, type PointLight } from 'three';
import {
  ambientTime,
  createCameraPath,
  createPose,
  handoffPose,
  poseCamera,
  projectToScreen,
  range,
  useChapterCamera,
  useChapterFrame,
  useChapterFx,
  useIsPortrait,
  usePartQuality,
  type CameraKeyframe,
} from '@/strata/story';
import { linearRGB } from '@/strata/shaders/palette';
import { Studio, type StudioFormer } from '@/strata/story/shared/studio';
import { buildFilament } from './filament';
import { buildHotend } from './hotend';
import { createFilamentMaterial, createHotendMaterial, createPlateMaterial, createSceneUniforms } from './materials';
import { MoltenDot, useMoltenDot } from './MoltenDot';
import { bakeContact, bakeGrain } from './plate';
import { liftAt } from './register';
import { REVEAL, cameraKeys } from './stage';
import { desktop, portrait as portraitLayout } from './strokes';
import { signals } from './signals';

const smooth = (a: number, b: number, v: number) => {
  const t = range(v, a, b);
  return t * t * (3 - 2 * t);
};
const sineInOut = (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Ch1's entry fx (STORYBOARD 3.4): Ch0 eases into them over its exit so the crossfade has one look. */
const NEXT_FX = { exposure: 1, bloom: [0.9, 0.72, 0.75], grain: 0.05, vignette: 0.4 } as const;
const OWN_FX = { exposure: 1, bloom: [1.1, 0.78, 0.7], grain: 0.05, vignette: 0.45 } as const;

const MOLTEN = new Color().setRGB(...linearRGB('molten'));

// The shared rig plus a cool front fill, a back strip that rims the letters and a low molten kick.
const RIG: readonly StudioFormer[] = [
  { color: '#C9D4E8', intensity: 0.5, scale: [10, 2.5], position: [0, 1.2, 9] },
  { color: '#F4F1EC', intensity: 1.6, scale: [14, 0.7], position: [0, 2.2, -9] },
  { color: '#FF6A1A', intensity: 0.15, scale: [2, 1], position: [6, -1, 5] },
];

/**
 * Ch0, Ignition. The headline lies on a dark build plate as three layers of printed filament; a small hotend
 * hovers over the period with its tip as the molten point of light. Scroll tilts the camera off the top-down
 * view (matched to the DOM headline), swings low from the left, racks focus along the line and pushes in on the
 * period, where only the molten dot survives into Ch1.
 */
export default function Scene() {
  const quality = usePartQuality();
  const portrait = useIsPortrait();
  const camera = useChapterCamera();
  const fx = useChapterFx();
  const layout = portrait ? portraitLayout : desktop;
  const P = layout.period;

  const path = useMemo(() => createCameraPath(cameraKeys(layout) as CameraKeyframe[]), [layout]);
  const uniforms = useMemo(() => createSceneUniforms(), []);
  const dot = useMoltenDot();
  const tipGlow = useMemo(() => ({ value: 1 }), []);
  const headShow = useMemo(() => ({ value: 0 }), []);
  const plateLight = useMemo(() => ({ uLightPos: { value: new Vector3() }, uLightColor: { value: new Color() } }), []);

  const filament = useMemo(() => buildFilament(layout, quality), [layout, quality]);
  useEffect(() => {
    uniforms.uPeriodFrom.value = filament.periodFrom;
  }, [uniforms, filament]);
  const hotend = useMemo(() => buildHotend(quality), [quality]);
  const plate = useMemo(() => {
    const geometry = new PlaneGeometry(600, 600, 1, 1);
    geometry.rotateX(-Math.PI / 2);
    const contact = bakeContact(layout);
    const grain = bakeGrain();
    return { geometry, contact, grain };
  }, [layout]);
  const materials = useMemo(
    () => ({
      filament: createFilamentMaterial(uniforms),
      hotend: createHotendMaterial(uniforms, tipGlow, headShow),
      plate: createPlateMaterial(uniforms, plateLight, {
        contact: plate.contact.texture,
        rough: plate.grain,
        contactRect: plate.contact.rect,
      }),
    }),
    [uniforms, tipGlow, headShow, plate, plateLight],
  );

  useEffect(() => () => filament.geometry.dispose(), [filament]);
  useEffect(() => () => hotend.dispose(), [hotend]);
  useEffect(
    () => () => {
      plate.geometry.dispose();
      plate.contact.texture.dispose();
      plate.grain.dispose();
    },
    [plate],
  );
  useEffect(
    () => () => {
      materials.filament.dispose();
      materials.hotend.dispose();
      materials.plate.dispose();
    },
    [materials],
  );

  const head = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  const tip = useMemo(() => ({ x: 0, y: 0, visible: false }), []);
  const pose = useMemo(() => createPose(), []);
  const fFocus = useMemo(() => {
    const first = layout.strokes[0];
    return [first.start[0] + 4, 2, first.start[1] - 6] as const;
  }, [layout]);

  useChapterFrame((_state, _delta, prog) => {
    const p = prog.p;
    const exit = prog.exit;

    const time = ambientTime(prog.raw);

    // Camera: the framed path inside the pin (fx 0.5 throughout), H1 about the dot through the exit handoff.
    // On desktop the target also rides the DOM headline's line until the copy panel leaves (liftAt).
    if (exit > 0) poseCamera(camera, handoffPose('0-1', exit, portrait, P, pose), { portrait });
    else path.apply(camera, prog.raw, { portrait });
    const lift = portrait || exit > 0 ? 0 : liftAt(p);
    if (lift > 1e-4) camera.setViewOffset(camera.aspect, 1, 0, lift, camera.aspect, 1);

    // Reveal under the SVG, then only the dot survives the exit.
    const reveal = smooth(REVEAL.from, REVEAL.to, p);
    uniforms.uFade.value = reveal * (1 - smooth(0, 0.6, exit));
    uniforms.uLetters.value = 1 - 0.5 * smooth(0.88, 1, p) - 0.5 * smooth(0, 0.5, exit);
    uniforms.uPeriod.value = 1 - smooth(0, 0.24, exit);
    dot.setOpacity(reveal);
    dot.setOccluded(exit <= 0);

    // Hotend: idles 4 mm over P, lifts 6 mm over the macro push. Seen from above it is only a dark sliver
    // beside the period, and the swing carries it in past the frame edge, so it comes up out of the dark once
    // the camera is low and the period is well inside the frame.
    // Over the exit the nozzle pulls straight up out of the macro, leaving the dot alone.
    const away = range(exit, 0, 0.4);
    const liftMM = 4 + 6 * sineInOut(range(p, 0.82, 1)) + 34 * away * away + 0.12 * Math.sin(time * 1.3);
    headShow.value = smooth(0.62, 0.74, p);
    const g = head.current;
    if (g) {
      g.position.set(P[0], P[1] + liftMM, P[2]);
      g.visible = headShow.value > 0.002;
    }
    const l = light.current;
    const flicker = 0.96 + 0.04 * Math.sin(time * 7.1);
    if (l) {
      l.position.set(P[0], P[1] + liftMM - 0.4, P[2]);
      l.intensity = 90 * uniforms.uFade.value * flicker;
    }
    plateLight.uLightPos.value.set(P[0], P[1] + liftMM - 0.4, P[2]);
    plateLight.uLightColor.value.copy(MOLTEN).multiplyScalar(90 * flicker);
    tipGlow.value = 0.9 + 0.1 * Math.sin(time * 5.3);

    // Focus: on "From" as the camera swings low, rack to the period, deep bokeh on the push. It holds on the dot
    // through the exit, so the letters fade out of focus; the renderer blends the bokeh down to Ch1's none.
    const dof = fx.dof;
    dof.enabled = p > 0.12;
    if (dof.enabled) {
      const dF = Math.hypot(camera.position.x - fFocus[0], camera.position.y - fFocus[1], camera.position.z - fFocus[2]);
      const dP = Math.hypot(camera.position.x - P[0], camera.position.y - P[1], camera.position.z - P[2]);
      dof.focusDistance = mix(dF, dP, sineInOut(range(p, 0.55, 0.82)));
      dof.focusRange = mix(mix(140, 34, smooth(0.12, 0.55, p)), 5, smooth(0.8, 0.97, p));
      dof.bokehScale = 4 * smooth(0.12, 0.55, p) + 4 * smooth(0, 0.6, exit);
    }

    // Heat haze over the nozzle tip until the push.
    projectToScreen(P[0], P[1] + liftMM, P[2], camera, tip);
    const haze = fx.haze[0];
    if (haze) {
      haze.x = tip.x;
      haze.y = tip.y;
      haze.radius = 0.04;
      haze.strength = tip.visible ? 0.3 * reveal * (1 - smooth(0.76, 0.82, p)) : 0;
    }
    signals.tipX = tip.x;
    signals.tipY = tip.y;

    // Over the exit, settle into Ch1's grade so the crossfade has one look.
    const e = smooth(0, 0.5, exit);
    fx.exposure = mix(OWN_FX.exposure, NEXT_FX.exposure, e);
    fx.bloom.intensity = mix(OWN_FX.bloom[0], NEXT_FX.bloom[0], e);
    fx.bloom.threshold = mix(OWN_FX.bloom[1], NEXT_FX.bloom[1], e);
    fx.bloom.radius = mix(OWN_FX.bloom[2], NEXT_FX.bloom[2], e);
    fx.grain = mix(OWN_FX.grain, NEXT_FX.grain, e);
    fx.vignette = mix(OWN_FX.vignette, NEXT_FX.vignette, e);
  });

  return (
    <>
      <Studio extra={RIG} intensity={1.8} />
      <directionalLight color="#FFF3E6" intensity={2.2} position={[-160, 260, 220]} />
      <mesh geometry={filament.geometry} material={materials.filament} renderOrder={0} />
      <group ref={head} rotation-y={-0.5} position={[P[0], P[1] + 4, P[2]]}>
        <mesh geometry={hotend} material={materials.hotend} renderOrder={0} />
      </group>
      <mesh geometry={plate.geometry} material={materials.plate} renderOrder={1} />
      <pointLight ref={light} color={MOLTEN} intensity={0} distance={0} decay={2} position={[P[0], P[1] + 3.6, P[2]]} />
      <MoltenDot position={P} parts={dot} />
    </>
  );
}
