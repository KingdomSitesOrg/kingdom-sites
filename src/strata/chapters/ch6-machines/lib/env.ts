import {
  BackSide,
  BoxGeometry,
  Color,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  type Texture,
  type WebGLRenderer,
} from 'three';

type Accent = { color: [number, number, number]; intensity: number; pos: [number, number, number]; size: [number, number] };

const baked = new WeakMap<WebGLRenderer, Texture[]>();

/**
 * The studio rig of STORYBOARD 3.3 baked into PMREM environments: a key softbox, two strip rims and one small
 * accent per cell. Plain emissive planes in a dark box. Baked once per renderer and kept, so a remount costs
 * nothing and leaks nothing.
 */
export function bakeEnvironments(gl: WebGLRenderer, accents: Accent[]): Texture[] {
  const hit = baked.get(gl);
  if (hit) return hit;
  const pmrem = new PMREMGenerator(gl);
  const disposables: { dispose: () => void }[] = [pmrem];
  const textures: Texture[] = [];
  const plane = new PlaneGeometry(1, 1);
  const room = new BoxGeometry(40, 40, 40);
  disposables.push(plane, room);

  for (const accent of accents) {
    const scene = new Scene();
    const roomMat = new MeshBasicMaterial({ color: new Color(0.004, 0.005, 0.008), side: BackSide });
    scene.add(new Mesh(room, roomMat));
    disposables.push(roomMat);
    const card = (rgb: [number, number, number], intensity: number, pos: [number, number, number], size: [number, number]) => {
      const m = new MeshBasicMaterial({ color: new Color(rgb[0] * intensity, rgb[1] * intensity, rgb[2] * intensity), side: DoubleSide });
      disposables.push(m);
      const mesh = new Mesh(plane, m);
      mesh.position.set(...pos);
      mesh.scale.set(size[0], size[1], 1);
      mesh.lookAt(0, 0, 0);
      scene.add(mesh);
    };
    card([0.957, 0.945, 0.925], 2.4, [0, 8, 6], [6, 6]);
    card([1, 1, 1], 3, [7, 1.5, 0], [0.6, 6]);
    card([1, 1, 1], 3, [-7, 1.5, 0], [0.6, 6]);
    card(accent.color, accent.intensity, accent.pos, accent.size);
    textures.push(pmrem.fromScene(scene, 0.02, 0.1, 100).texture);
  }
  disposables.forEach((d) => d.dispose());
  baked.set(gl, textures);
  return textures;
}
