import type { TColor } from './types/TColor';
import type { TVector3 } from './types/TVector3';
import type { TVector2 } from './types/TVector2';

import { XMath } from './lib/XMath';

let Screen: ImageData = new ImageData(1, 1);

// Cached data
let Width: number = 1;
let Height: number = 1;
let Size: number = 1;
let Color: TColor = { r: 0, g: 0, b: 0, a: 0 };
let ZBuffer: number[] = [-Infinity];
let ZBufferImageData: ImageData;

const isValid = (x: number, y: number): boolean => {
  return x >= 0 && y >= 0 && x < Width && y < Height;
};

const init = (width: number, height: number): void => {
  Screen = new ImageData(width, height);
  Width = width;
  Height = height;
  Size = width * height * 4;
  ZBuffer = new Array(width * height).fill(-Infinity);
  ZBufferImageData = new ImageData(width, height);
};

const add = (x: number, y: number): void => {
  if (!isValid(x, y)) return;

  const { r, g, b, a } = Color;
  const { data } = Screen;
  const i = ((y | 0) * Width + (x | 0)) * 4;
  if (a === 255) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
  } else {
    const ta = a / 255;
    const ata = 1 - ta;
    data[i] = XMath.clamp255(data[i] * ata + r * ta);
    data[i + 1] = XMath.clamp255(data[i + 1] * ata + g * ta);
    data[i + 2] = XMath.clamp255(data[i + 2] * ata + b * ta);
    data[i + 3] = XMath.clamp255(data[i + 3] + a);
  }
};

const set = (x: number, y: number, color: TColor): void => {
  return isValid(x, y) ? setUnsafe(x | 0, y | 0, color) : undefined;
};

const setUnsafe = (x: number, y: number, color: TColor): void => {
  const { r, g, b, a } = color;
  const { data } = Screen;
  const i = (y * Width + x) * 4;
  data[i] = r;
  data[i + 1] = g;
  data[i + 2] = b;
  data[i + 3] = a;
};

const setZBuffer = (x: number, y: number, value: number): void => {
  return isValid(x, y) ? setZBufferUnsafe(x | 0, y | 0, value) : undefined;
};

const setZBufferUnsafe = (x: number, y: number, value: number): void => {
  ZBuffer[y * Width + x] = value;
};

const get = (x: number, y: number): TColor => {
  let r = 0, g = 0, b = 0, a = 0;
  if (isValid(x, y)) {
    const i = ((y >> 0) * Width + (x >> 0)) * 4;
    [r, g, b, a] = Screen.data.slice(i, i + 4);
  }
  return { r, g, b, a };
};

const getZBuffer = (x: number, y: number): number => {
  return isValid(x, y) ? ZBuffer[(y | 0) * Width + (x | 0)] : -Infinity;
};

const clear = (): void => {
  const { data } = Screen;
  for (let i = 0; i < Size; i++) {
    data[i] = 0;
  }
};

const clearZBuffer = (): void => {
  const bufLen = ZBuffer.length;
  for (let i = 0; i < bufLen; i++) {
    ZBuffer[i] = -Infinity;
  }
};

const fill = (): void => {
  const { data } = Screen;
  const { r, g, b, a } = Color;
  if (a === 255) {
    for (let i = 0; i < Size; i += 4) {
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    }
  } else {
    const ta = a / 255;
    const ata = 1 - ta;
    for (let i = 0; i < Size; i += 4) {
      data[i] = XMath.clamp255(data[i] * ata + r * ta);
      data[i + 1] = XMath.clamp255(data[i + 1] * ata + g * ta);
      data[i + 2] = XMath.clamp255(data[i + 2] * ata + b * ta);
      data[i + 3] = XMath.clamp255(data[i + 3] + a);
    }
  }
};

const line = (a: TVector2, b: TVector2) => {
  let ax = a.x | 0;
  let ay = a.y | 0;
  let bx = b.x | 0;
  let by = b.y | 0;

  if (ax === bx && ay === by) {
    return set(ax, ay, Color);
  }

  let isTranspose = false;

  if (Math.abs(by - ay) > Math.abs(bx - ax)) {
    isTranspose = true;
    [ax, ay] = [ay, ax];
    [bx, by] = [by, bx];
  }

  if (ax > bx) {
    [ax, bx] = [bx, ax];
    [ay, by] = [by, ay];
  }

  const dx = bx - ax;
  const dy = by - ay;

  const deltaError = Math.abs(dy) * 2;
  const dirY = Math.sign(by - ay);
  let error = 0;

  let y = ay;
  for (let x = ax; x <= bx; x++) {
    if (isTranspose) {
      set(y, x, Color);
    } else {
      set(x, y, Color);
    }

    error += deltaError;

    if (error >= dx) {
      y += dirY;
      error -= dx * 2;
    }
  }
};
const lineTriangle = (a: TVector2, b: TVector2, c: TVector2) => {
  line(a, b);
  line(b, c);
  line(c, a);
};

const fillTriangle = (a: TVector3, b: TVector3, c: TVector3) => {
  if (a.y < b.y) [a, b] = [b, a];
  if (a.y < c.y) [a, c] = [c, a];
  if (b.y < c.y) [b, c] = [c, b];

  const interpolate = (y: number, v1: TVector3, v2: TVector3): TVector3 => {
    const t = (y - v1.y) / (v2.y - v1.y);
    return {
      x: v1.x + t * (v2.x - v1.x),
      y: v1.y + t * (v2.y - v1.y),
      z: v1.z + t * (v2.z - v1.z),
    };
  };

  const drawScanline = (y: number, x1: number, z1: number, x2: number, z2: number) => {
    if (x1 > x2) {
      [x1, x2] = [x2, x1];
      [z1, z2] = [z2, z1];
    }

    for (let x = Math.ceil(x1); x <= Math.floor(x2); x++) {
      const t = (x - x1) / (x2 - x1 || 1); // Avoid division by zero
      const z = z1 + t * (z2 - z1);

      const zBufferIndex = Math.floor(y) * Width + Math.floor(x);
      if (ZBuffer[zBufferIndex] >= z) {
        continue;
      }

      ZBuffer[zBufferIndex] = z;
      set(x, y, Color);
    }
  };

  const processTrianglePart = (yStart: number, yEnd: number, left: TVector3, right: TVector3) => {
    for (let y = Math.floor(yStart); y >= Math.ceil(yEnd); y--) {
      const leftPoint = interpolate(y, left, right);
      const rightPoint = interpolate(y, a, c);
      drawScanline(y, leftPoint.x, leftPoint.z, rightPoint.x, rightPoint.z);
    }
  };

  // Верхняя часть треугольника
  if (b.y !== a.y) {
    processTrianglePart(a.y, b.y, a, b);
  }

  // Нижняя часть треугольника
  if (c.y !== b.y) {
    processTrianglePart(b.y, c.y, b, c);
  }
};

const getImageData = () => Screen;
const getDepthData = (): ImageData => {
  const { data: outData } = ZBufferImageData;

  for (let i = 0, j = 0; i < Size; i += 4, j++) {
    const bufValue = ZBuffer[j];
    const value = Number.isFinite(bufValue) ? 255 - XMath.clamp255(-bufValue >> 2) : 0;
    outData[i] = value;
    outData[i + 1] = value;
    outData[i + 2] = value;
    outData[i + 3] = 255;
  }

  return ZBufferImageData;
}
const getWidth = () => Width;
const getHeight = () => Height;

const setColor = (color: TColor) => (Color = color);

export const XScreen = {
  init,

  add,
  set,
  setZBuffer,
  get,
  getZBuffer,

  clearZBuffer,

  clear,
  fill,
  line,
  lineTriangle,
  fillTriangle,

  getImageData,
  getDepthData,
  getWidth,
  getHeight,
  setColor,
};