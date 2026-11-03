'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  Color,
  Mesh,
  MeshDepthMaterial,
  OrthographicCamera,
  PlaneGeometry,
  ShaderMaterial,
  WebGLRenderTarget,
  type Group,
} from 'three';
import { HorizontalBlurShader } from 'three/examples/jsm/shaders/HorizontalBlurShader.js';
import { VerticalBlurShader } from 'three/examples/jsm/shaders/VerticalBlurShader.js';

/**
 * drei's ContactShadows baked once (its frames=1 path), but disposing its render targets, materials and plane on
 * unmount: drei's keeps two render targets per mount, so every remount of the chapter leaked GPU textures.
 */
export function ContactShadow({
  scale,
  far,
  blur,
  opacity,
  resolution,
  y,
}: {
  scale: readonly [number, number];
  far: number;
  blur: number;
  opacity: number;
  resolution: number;
  y: number;
}) {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const group = useRef<Group>(null);
  const done = useRef(false);
  const [w, h] = scale;

  const rig = useMemo(() => {
    const target = new WebGLRenderTarget(resolution, resolution);
    const targetBlur = new WebGLRenderTarget(resolution, resolution);
    target.texture.generateMipmaps = targetBlur.texture.generateMipmaps = false;
    const plane = new PlaneGeometry(w, h).rotateX(Math.PI / 2);
    const blurPlane = new Mesh(plane);
    const depth = new MeshDepthMaterial();
    depth.depthTest = depth.depthWrite = false;
    depth.onBeforeCompile = (shader) => {
      shader.uniforms.ucolor = { value: new Color('#000000') };
      shader.fragmentShader = shader.fragmentShader
        .replace('void main() {', 'uniform vec3 ucolor;\nvoid main() {')
        .replace('vec4( vec3( 1.0 - fragCoordZ ), opacity );', 'vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );');
    };
    const hBlur = new ShaderMaterial(HorizontalBlurShader);
    const vBlur = new ShaderMaterial(VerticalBlurShader);
    hBlur.depthTest = vBlur.depthTest = false;
    const camera = new OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0, far);
    return { target, targetBlur, plane, blurPlane, depth, hBlur, vBlur, camera };
  }, [resolution, w, h, far]);

  useEffect(() => {
    done.current = false;
    return () => {
      rig.target.dispose();
      rig.targetBlur.dispose();
      rig.plane.dispose();
      rig.depth.dispose();
      rig.hBlur.dispose();
      rig.vBlur.dispose();
    };
  }, [rig]);

  useFrame(() => {
    const g = group.current;
    if (done.current || !g) return;
    done.current = true;
    const { target, targetBlur, blurPlane, depth, hBlur, vBlur, camera } = rig;
    const pass = (amount: number) => {
      blurPlane.visible = true;
      blurPlane.material = hBlur;
      hBlur.uniforms.tDiffuse.value = target.texture;
      hBlur.uniforms.h.value = amount / 256;
      gl.setRenderTarget(targetBlur);
      gl.render(blurPlane, camera);
      blurPlane.material = vBlur;
      vBlur.uniforms.tDiffuse.value = targetBlur.texture;
      vBlur.uniforms.v.value = amount / 256;
      gl.setRenderTarget(target);
      gl.render(blurPlane, camera);
      blurPlane.visible = false;
    };
    const background = scene.background;
    const override = scene.overrideMaterial;
    g.visible = false;
    scene.background = null;
    scene.overrideMaterial = depth;
    gl.setRenderTarget(target);
    gl.render(scene, camera);
    pass(blur);
    pass(blur * 0.4);
    gl.setRenderTarget(null);
    g.visible = true;
    scene.overrideMaterial = override;
    scene.background = background;
  });

  return (
    <group ref={group} rotation-x={Math.PI / 2} position-y={y}>
      <mesh geometry={rig.plane} scale={[1, -1, 1]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial transparent map={rig.target.texture} opacity={opacity} depthWrite={false} />
      </mesh>
      <primitive object={rig.camera} />
    </group>
  );
}
