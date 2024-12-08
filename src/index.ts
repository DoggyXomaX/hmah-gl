import type { TMesh } from './xmaxgl/types/TMesh';
import type { TVector3 } from './xmaxgl/types/TVector3';

import { XScreen } from './xmaxgl/XScreen';
import { calculateAspectSize } from './xmaxgl/utils/calculateAspectSize';
import type { TColor } from './xmaxgl/types/TColor';

const canvas = document.querySelector<HTMLCanvasElement>('.viewport__canvas');
if (!canvas) throw Error('Viewport not found!');

const context = canvas.getContext('2d');
if (!context) throw Error('Cannot get content from viewport!');

// Rescale canvas
new ResizeObserver((entries) => {
  const target = entries[0].target as HTMLBodyElement;
  const { width, height } = calculateAspectSize(
    target.offsetWidth,
    target.offsetHeight,
    canvas.width,
    canvas.height,
  );

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
}).observe(document.body);

const init = () => {
  XScreen.init(canvas.width, canvas.height);
  window.onkeydown = (e) => {
    switch (e.code) {
      case 'KeyA': angleY += 0.05; break;
      case 'KeyD': angleY -= 0.05; break;
      case 'KeyW': angleX -= 0.05; break;
      case 'KeyS': angleX += 0.05; break;
      case 'Space': isShowDepth = !isShowDepth; break;
      case 'KeyR': isAutoRotate = !isAutoRotate; break;
    }
  }
  update();
};

let angleX = 0.5;
let angleY = 0.5;
let isAutoRotate = true;
let isShowDepth = false;

const update = () => {
  render();

  if (isAutoRotate) {
    angleX += 0.002;
    angleY += 0.001;
  }

  const debugInfo = document.querySelector<HTMLSpanElement>('#debug-info');
  if (debugInfo) {
    const xDeg = (angleX * 180 / Math.PI).toFixed(2);
    const yDeg = (angleY * 180 / Math.PI).toFixed(2);
    debugInfo.innerText = `angleX: ${xDeg}deg, angleY: ${yDeg}deg`
  }

  // setTimeout(update, 500);
  requestAnimationFrame(update);
};

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

  const useRandomColors = true;

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

const cubeSize = 1;

const meshes: TMesh[] = [
  createCubeMesh(cubeSize, cubeSize, cubeSize),
  createCubeMesh(cubeSize / 2, cubeSize * 2, cubeSize / 2),
  createCubeMesh(cubeSize * 2, cubeSize / 2, cubeSize / 2),
  createCubeMesh(cubeSize * 3, cubeSize / 3, cubeSize / 3),
];

const toViewport = (p: TVector3): TVector3 => {
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

  const dist = 1;
  const proj = dist / (dist + Math.abs(z));
  x *= proj;
  y *= proj;

  return {
    x: (1 + x) * halfWidth,
    y: (1 - y) * halfHeight,
    z: z * halfDepth,
  };
};

const nativeRender = () => {
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

  context.putImageData(isShowDepth ? XScreen.getDepthData() : XScreen.getImageData(), 0, 0);
};

const render = nativeRender;

init();