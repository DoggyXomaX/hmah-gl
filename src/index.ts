import type { TMesh } from './xmaxgl/types/TMesh';
import type { TVector3 } from './xmaxgl/types/TVector3';
import type { TColor } from './xmaxgl/types/TColor';

import { XScreen } from './xmaxgl/XScreen';
import { XTextures } from './xmaxgl/XTextures';
import { calculateAspectSize } from './xmaxgl/utils/calculateAspectSize';

import hmah from './assets/hmah.jpg';

const defaultState = {
  canvas: undefined as unknown as HTMLCanvasElement,
  context: undefined as unknown as CanvasRenderingContext2D,

  angleX: 0.5,
  angleY: 0.5,
  isAutoRotate: true,
  isShowDepth: false,

  fps: 0,
  fpsDisplay: 0,
};
const state = { ...defaultState };

const addResizeObserver = () => {
  const observer = new ResizeObserver((entries) => {
    const { canvas } = state;
    if (!canvas) return;

    const target = entries[0].target as HTMLBodyElement;
    const { width, height } = calculateAspectSize(
      target.offsetWidth,
      target.offsetHeight,
      canvas.width,
      canvas.height,
    );

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
  });

  observer.observe(document.body);
};

const addHotkeyListeners = () => {
  window.onkeydown = (e) => {
    switch (e.code) {
      case 'KeyA': state.angleY += 0.05; break;
      case 'KeyD': state.angleY -= 0.05; break;
      case 'KeyW': state.angleX -= 0.05; break;
      case 'KeyS': state.angleX += 0.05; break;
      case 'Space': state.isShowDepth = !state.isShowDepth; break;
      case 'KeyR': state.isAutoRotate = !state.isAutoRotate; break;
    }
  }
};

const startFpsTimer = () => {
  setInterval(() => {
    state.fpsDisplay = state.fps * 2;
    state.fps = 0;
  }, 500);
};

const initCanvas = (): boolean => {
  const canvas = document.querySelector<HTMLCanvasElement>('.viewport__canvas');
  if (!canvas) {
    console.error('Viewport not found!');
    return false;
  }

  const context = canvas.getContext('2d');
  if (!context) {
    console.error('Cannot get content from viewport!');
    return false;
  }

  state.canvas = canvas;
  state.context = context;

  return true;
};

const init = async () => {
  if (!initCanvas()) return;

  const { canvas } = state;
  XScreen.init(canvas.width, canvas.height);

  const paths = [hmah];
  XTextures.resize(paths.length)

  await Promise.all(paths.map(async (path, i) => {
    const texture = await XTextures.loadTexture(path);
    if (!texture) throw Error(`Failed to load texture[${i}] "${path}"`);
    XTextures.addTexture(texture, i);
  }));

  console.log(XTextures.textures[0]);

  addResizeObserver();
  addHotkeyListeners();

  startFpsTimer();
  requestAnimationFrame(update);
};

const update = () => {
  const { canvas } = state;

  if (state.isAutoRotate) {
    state.angleX += 0.002;
    state.angleY += 0.001;
  }

  const debugInfo = document.querySelector<HTMLSpanElement>('#debug-info');
  if (debugInfo) {
    const xDeg = (state.angleX * 180 / Math.PI).toFixed(2);
    const yDeg = (state.angleY * 180 / Math.PI).toFixed(2);

    const info = [
      `Rotation: X: ${xDeg}, Y: ${yDeg}, Z: 0`,
      `Rendering: ${state.isShowDepth ? 'Depth' : 'Image'} [${canvas.width} X ${canvas.height}]`,
      `FPS: ${state.fpsDisplay}`,
    ];

    debugInfo.innerText = info.join('\n');
  }

  render();
  state.fps++;

  requestAnimationFrame(update);
};

const cubeSize = 1;
const createCubeMesh = (w: number, h: number, d: number): TMesh => {
  w /= 2;
  h /= 2;
  d /= 2;

  const c = (): TColor => ({
    r: Math.random() * 255 | 0,
    g: Math.random() * 255 | 0,
    b: Math.random() * 255 | 0,
    a: 255,
  });

  const useRandomColors = false;

  const backColor = useRandomColors ? c() : { r: 0, g: 0, b: 192, a: 255 }
  const frontColor = useRandomColors ? c() : { r: 0, g: 192, b: 0, a: 255 };
  const leftColor = useRandomColors ? c() : { r: 0, g: 192, b: 192, a: 255 };
  const rightColor = useRandomColors ? c() : { r: 192, g: 0, b: 0, a: 255 };
  const topColor = useRandomColors ? c() : { r: 192, g: 0, b: 192, a: 255 };
  const bottomColor = useRandomColors ? c() : { r: 192, g: 192, b: 0, a: 255 };

  return {
    parts: [
      // Back
      {
        color: backColor,
        surface: {
          points: [
            { x:  w, y:  h, z: -d },
            { x: -w, y:  h, z: -d },
            { x: -w, y: -h, z: -d },
            { x:  w, y: -h, z: -d },
          ],
          polys: [0, 1, 3, 2, 1, 3],
          uvs: [],
        }
      },
      // Front
      {
        color: frontColor,
        surface: {
          points: [
            { x: -w, y:  h, z:  d },
            { x:  w, y:  h, z:  d },
            { x:  w, y: -h, z:  d },
            { x: -w, y: -h, z:  d },
          ],
          polys: [0, 1, 3, 2, 1, 3],
          uvs: [],
        }
      },
      // Left
      {
        color: leftColor,
        surface: {
          points: [
            { x: -w, y:  h, z: -d },
            { x: -w, y:  h, z:  d },
            { x: -w, y: -h, z:  d },
            { x: -w, y: -h, z: -d },
          ],
          polys: [0, 1, 3, 2, 1, 3],
          uvs: [],
        }
      },
      // Right
      {
        color: rightColor,
        surface: {
          points: [
            { x:  w, y:  h, z:  d },
            { x:  w, y:  h, z: -d },
            { x:  w, y: -h, z: -d },
            { x:  w, y: -h, z:  d },
          ],
          polys: [0, 1, 3, 2, 1, 3],
          uvs: [],
        }
      },
      // Top
      {
        color: topColor,
        surface: {
          points: [
            { x: -w, y:  h, z: -d },
            { x:  w, y:  h, z: -d },
            { x:  w, y:  h, z:  d },
            { x: -w, y:  h, z:  d },
          ],
          polys: [0, 1, 3, 2, 1, 3],
          uvs: [],
        }
      },
      // Bottom
      {
        color: bottomColor,
        surface: {
          points: [
            { x: -w, y: -h, z:  d },
            { x:  w, y: -h, z:  d },
            { x:  w, y: -h, z: -d },
            { x: -w, y: -h, z: -d },
          ],
          polys: [0, 1, 3, 2, 1, 3],
          uvs: [],
        }
      },
    ],
  };
};
const meshes: TMesh[] = [
  createCubeMesh(cubeSize, cubeSize, cubeSize),
  createCubeMesh(cubeSize / 2, cubeSize * 2, cubeSize / 2),
  createCubeMesh(cubeSize * 2, cubeSize / 2, cubeSize / 2),
  createCubeMesh(cubeSize * 3, cubeSize / 3, cubeSize / 3),
  createCubeMesh(cubeSize * 20, cubeSize * 20, cubeSize * 20),
];

const toViewport = (p: TVector3): TVector3 => {
  const { canvas, angleX, angleY } = state;

  const halfWidth = canvas.width / 2;
  const halfHeight = canvas.height / 2;
  const halfDepth = 256;

  const cosY = Math.cos(angleY);
  const sinY = Math.sin(angleY);

  let x = p.x * cosY + p.z * sinY;
  let y = p.y;
  let z = p.z * cosY - p.x * sinY;

  const cosX = Math.cos(angleX);
  const sinX = Math.sin(angleX);

  let ty = y * cosX - z * sinX;
  z = z * cosX + y * sinX;
  y = ty;

  z -= cubeSize * 2;

  const aspectX = halfHeight / halfWidth;
  x *= aspectX;

  const dist = 4;
  const proj = dist / (dist + Math.abs(z));
  x *= proj;
  y *= proj;

  return {
    x: (1 + x) * halfWidth,
    y: (1 - y) * halfHeight,
    z: z * halfDepth,
  };
};

const render = () => {
  XScreen.clear();
  XScreen.clearZBuffer();

  const meshesCount = meshes.length;
  for (let m = 0; m < meshesCount; m++) {
    const { parts } = meshes[m];
    const partsCount = parts.length;
    for (let i = 0; i < partsCount; i++) {
      const { color, surface: { points, polys } } = parts[i];
      const polysLength = polys.length;
      XScreen.setColor(color ?? { r: 255, g: 0, b: 0, a : 255 });

      for (let j = 0; j < polysLength; j += 3) {
        const a = toViewport(points[polys[j]]);
        const b = toViewport(points[polys[j + 1]]);
        const c = toViewport(points[polys[j + 2]]);
        XScreen.fillTriangle(a, b, c);
      }
    }
  }

  state.context.putImageData(state.isShowDepth ? XScreen.getDepthData() : XScreen.getImageData(), 0, 0);
};

window.addEventListener('DOMContentLoaded', init);