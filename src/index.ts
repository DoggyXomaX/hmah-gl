import type { TMesh } from './hmahgl/types/TMesh';
import type { TVector3 } from './hmahgl/types/TVector3';
import type { TColor } from './hmahgl/types/TColor';
import type { TVector2 } from './hmahgl/types/TVector2';

import { FilteringType, XScreen } from './hmahgl/XScreen';
import { XTextures } from './hmahgl/XTextures';
import { calculateAspectSize } from './hmahgl/utils/calculateAspectSize';

import hmah from './assets/hmah.jpg';
import skybox from './assets/skybox.jpg';

let canvas: HTMLCanvasElement = document.querySelector('.viewport__canvas')!;
if (!canvas) throw Error('No .viewport__canvas!');

let context: CanvasRenderingContext2D = canvas.getContext('2d')!;
if (!context) throw Error('Failed to get canvas context!');

const paths = [hmah, skybox];

const defaultState = {
  angleX: 0.5,
  angleY: 0.5,
  isAutoRotate: true,
  isShowDepth: false,
  filteringType: FilteringType.Nearest,

  fps: 0,
  fpsDisplay: 0,
};

// Fucking hot reload stuff
const DEV_STATE_KEY = '__devstate';
const AUTO_SAVE_INTERVAL = 250;

const isHot = 'hot' in module;
const devStateText = localStorage.getItem(DEV_STATE_KEY);
const devState = isHot && devStateText ? JSON.parse(devStateText) : undefined;
const state = devState ? { ...defaultState, ...devState } : { ...defaultState };

if (isHot) {
  setInterval(() => {
    localStorage.setItem(DEV_STATE_KEY, JSON.stringify(state));
  }, AUTO_SAVE_INTERVAL);
}
// End of fucking hot reload stuff

const addResizeObserver = () => {
  const observer = new ResizeObserver((entries) => {
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
      case 'KeyF': state.filteringType = state.filteringType === FilteringType.Nearest ? FilteringType.Bilinear : FilteringType.Nearest; break;
      case 'Space': state.isShowDepth = !state.isShowDepth; break;
      case 'KeyR': state.isAutoRotate = !state.isAutoRotate; break;
      case 'KeyQ': localStorage.removeItem(DEV_STATE_KEY); window.location.reload(); break;
    }
  }
};

const startFpsTimer = () => {
  setInterval(() => {
    state.fpsDisplay = state.fps * 2;
    state.fps = 0;
  }, 500);
};

const init = async () => {
  XScreen.init(canvas.width, canvas.height);

  XTextures.resize(paths.length);
  await Promise.all(paths.map(async (path, i) => {
    const texture = await XTextures.loadTexture(path);
    if (!texture) throw Error(`Failed to load texture[${i}] "${path}"`);
    XTextures.addTexture(texture, i);
  }));

  addResizeObserver();
  addHotkeyListeners();

  startFpsTimer();
  requestAnimationFrame(update);
};

const update = () => {
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
      `Rendering: ${state.isShowDepth ? 'Depth' : 'Image'} (${FilteringType[state.filteringType]}) [${canvas.width} X ${canvas.height}]`,
      `FPS: ${state.fpsDisplay}`,
    ];

    debugInfo.innerText = info.join('\n');
  }

  render();
  state.fps++;

  // setTimeout(update, 2500);
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

  const polys = [0, 1, 3, 2, 1, 3];
  const uvs = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }];

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
          polys,
          uvs,
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
          polys,
          uvs,
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
          polys,
          uvs,
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
          polys,
          uvs,
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
          polys,
          uvs,
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
          polys,
          uvs,
        }
      },
    ],
  };
};

const createHmahScene = (): TMesh[] => {
  const points: TVector3[] = [];
  const polys: number[] = [];
  const uvs: TVector2[] = [];

  const di = (Math.PI * 2) / 8;
  for (let p = 0; p < 3; p++) {
    for (let i = 0; i < 8; i++) {
      const a = di * i;
      const cos = Math.cos(a);
      const sin = Math.sin(a);

      const m = p === 1 ? 2 : 1;
      const my = p;

      points.push({
        x: cos * 0.5 * m,
        y: 1 - p,
        z: sin * 0.5 * m,
      });
      uvs.push({
        x: 0.59 + cos * 0.1 * my,
        y: 0.25 + sin * 0.15 * my,
      });
    }
  }

  // Upper cap
  polys.push(7, 0, 1, 6, 7, 1, 6, 1, 2, 5, 6, 2, 5, 2, 3, 5, 3, 4);

  // Top/Bottom side
  for (let p = 0; p < 2; p++) {
    const a = p * 8;
    const b = (p + 1) * 8;
    for (let i = 0; i < 8; i++) {
      const di = (7 + i) % 8;
      polys.push(a + i, a + di, b + i, b + i, a + di, b + di);
    }
  }

  // Lower cap
  polys.push(23, 16, 17, 22, 23, 17, 22, 17, 18, 21, 22, 18, 21, 18, 19, 21, 19, 20);

  return [
    {
      parts: [
        {
          surface: {
            points,
            polys,
            uvs,
          }
        }
      ]
    }
  ];
};

const cubesScene: TMesh[] = [
  createCubeMesh(cubeSize, cubeSize, cubeSize),
  createCubeMesh(cubeSize / 2, cubeSize * 2, cubeSize / 2),
  createCubeMesh(cubeSize * 2, cubeSize / 2, cubeSize / 2),
  createCubeMesh(cubeSize * 3, cubeSize / 3, cubeSize / 3),
  createCubeMesh(cubeSize * 20, cubeSize * 20, cubeSize * 20),
];

const hmahScene: TMesh[] = createHmahScene();

const meshes: TMesh[] = cubesScene;

const toViewport = (p: TVector3): TVector3 => {
  const { angleX, angleY } = state;

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

  const { filteringType } = state;

  const meshesCount = meshes.length;
  for (let m = 0; m < meshesCount; m++) {
    const { parts } = meshes[m];

    const isSkybox = m === 4;
    const texture = XTextures.textures[isSkybox ? 1 : 0];
    if (!texture) continue;

    const partsCount = parts.length;
    for (let i = 0; i < partsCount; i++) {
      const { color, surface: { points, uvs, polys } } = parts[i];
      const polysLength = polys.length;
      XScreen.setColor(color ?? { r: 255, g: 0, b: 0, a : 255 });

      for (let j = 0; j < polysLength; j += 3) {
        const aIndex = polys[j];
        const bIndex = polys[j + 1];
        const cIndex = polys[j + 2];
        // TODO: vertex shader with matrices instead of this shit
        const a = toViewport(points[aIndex]);
        const b = toViewport(points[bIndex]);
        const c = toViewport(points[cIndex]);
        const aUV = uvs[aIndex];
        const bUV = uvs[bIndex];
        const cUV = uvs[cIndex];
        XScreen.fillTextureTriangle(a, b, c, aUV, bUV, cUV, texture, filteringType);
      }
    }
  }

  context.putImageData(state.isShowDepth ? XScreen.getDepthData() : XScreen.getImageData(), 0, 0);
};

window.addEventListener('DOMContentLoaded', init);