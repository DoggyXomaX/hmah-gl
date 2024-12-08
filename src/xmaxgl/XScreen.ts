import type { TColor } from './types/TColor';
import type { TVector3 } from './types/TVector3';
import type { TVector2 } from './types/TVector2';
import { clamp255, lerpf } from './lib/XMath';
import { XVector3 } from './lib/XVector3';
import { XVector2 } from './lib/XVector2';

let Screen: ImageData = new ImageData(1, 1);

// Cached data
let UseFastRender = true;
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
    data[i] = clamp255(data[i] * ata + r * ta);
    data[i + 1] = clamp255(data[i + 1] * ata + g * ta);
    data[i + 2] = clamp255(data[i + 2] * ata + b * ta);
    data[i + 3] = clamp255(data[i + 3] + a);
  }
};

const set = (x: number, y: number, color: TColor): void => {
  return isValid(x, y) ? setUnsafe(x | 0, y | 0, color) : undefined;
};

const setZBuffered = (x: number, y: number, z: number, color: TColor): void => {
  return isValid(x, y) ? setZBufferedUnsafe(Math.round(x), Math.round(y), z, color) : undefined;
};

const setZBufferedUnsafe = (x: number, y: number, z: number, color: TColor): void => {
  const zBufferIndex = y * Width + x;
  if (ZBuffer[zBufferIndex] < z) {
    ZBuffer[zBufferIndex] = z;
    set(x, y, color);
  }
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

const get = (x: number, y: number): TColor => {
  let r = 0, g = 0, b = 0, a = 0;
  if (isValid(x, y)) {
    const i = ((y >> 0) * Width + (x >> 0)) * 4;
    [r, g, b, a] = Screen.data.slice(i, i + 4);
  }
  return { r, g, b, a };
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
      data[i] = clamp255(data[i] * ata + r * ta);
      data[i + 1] = clamp255(data[i + 1] * ata + g * ta);
      data[i + 2] = clamp255(data[i + 2] * ata + b * ta);
      data[i + 3] = clamp255(data[i + 3] + a);
    }
  }
};

const line = (a: TVector2, b: TVector2) => {
  let ax = Math.round(a.x);
  let ay = Math.round(a.y);
  let bx = Math.round(b.x);
  let by = Math.round(b.y);

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
  let ai: TVector3, bi: TVector3, ci: TVector3;
  if (UseFastRender) {
    ai = { x: Math.round(a.x), y: Math.round(a.y), z: a.z }
    bi = { x: Math.round(b.x), y: Math.round(b.y), z: b.z }
    ci = { x: Math.round(c.x), y: Math.round(c.y), z: c.z }
  } else {
    [ai, bi, ci] = [a, b, c];
  }

  if (ai.y < bi.y) [ai, bi] = [bi, ai];
  if (ai.y < ci.y) [ai, ci] = [ci, ai];
  if (bi.y < ci.y) [bi, ci] = [ci, bi];

  const fillTrianglePart = (yStart: number, yEnd: number, left: TVector3, right: TVector3) => {
    const fromY = Math.max(0, Math.ceil(yEnd));
    const toY = Math.min(Height - 1, Math.floor(yStart));

    const dy1 = 1 / (right.y - left.y);
    const dy2 = 1 / (ci.y - ai.y);

    for (let y = fromY; y <= toY; y++) {
      let { x: x1, z: z1 } = XVector3.lerpf(left, right, (y - left.y) * dy1);
      let { x: x2, z: z2} = XVector3.lerpf(ai, ci, (y - ai.y) * dy2);

      if (x1 > x2) {
        [x1, x2] = [x2, x1];
        [z1, z2] = [z2, z1];
      }

      const fromX = Math.max(0, Math.ceil(x1));
      const toX = Math.min(Width - 1, Math.floor(x2));
      for (let x = fromX; x <= toX; x++) {
        const t = (x - x1) / (x2 - x1 || 1);
        const z = lerpf(z1, z2, t);
        if (z > 0) continue;

        const zBufferIndex = y * Width + x;
        if (ZBuffer[zBufferIndex] < z) {
          ZBuffer[zBufferIndex] = z;
          set(x, y, Color);
        }
      }
    }
  };

  if (UseFastRender) {
    if (bi.y !== ai.y) fillTrianglePart(ai.y, bi.y, ai, bi);
    if (bi.y !== ci.y) fillTrianglePart(bi.y, ci.y, bi, ci);
  } else {
    fillTrianglePart(ai.y, bi.y, ai, bi);
    fillTrianglePart(bi.y, ci.y, bi, ci);
  }
};

const fillTextureTriangle = (
  a: TVector3, b: TVector3, c: TVector3,
  aUV: TVector2, bUV: TVector2, cUV: TVector2,
  texture: ImageData
) => {
  let ai: TVector3, bi: TVector3, ci: TVector3;
  if (UseFastRender) {
    ai = { x: Math.round(a.x), y: Math.round(a.y), z: a.z }
    bi = { x: Math.round(b.x), y: Math.round(b.y), z: b.z }
    ci = { x: Math.round(c.x), y: Math.round(c.y), z: c.z }
  } else {
    [ai, bi, ci] = [a, b, c];
  }

  if (ai.y < bi.y) {
    [ai, bi] = [bi, ai];
    [aUV, bUV] = [bUV, aUV];
  }
  if (ai.y < ci.y) {
    [ai, ci] = [ci, ai];
    [aUV, cUV] = [cUV, aUV];
  }
  if (bi.y < ci.y) {
    [bi, ci] = [ci, bi];
    [bUV, cUV] = [cUV, bUV];
  }

  const fillTrianglePart = (
    left: TVector3, right: TVector3,
    uvLeft: TVector2, uvRight: TVector2,
  ) => {
    const yStart = left.y;
    const yEnd = right.y;

    const fromY = Math.max(0, Math.ceil(yEnd));
    const toY = Math.min(Height - 1, Math.floor(yStart));

    const dy1 = 1 / (right.y - left.y);
    const dy2 = 1 / (ci.y - ai.y);

    for (let y = fromY; y <= toY; y++) {
      let { x: x1, z: z1 } = XVector3.lerpf(left, right, (y - left.y) * dy1);
      let { x: x2, z: z2} = XVector3.lerpf(ai, ci, (y - ai.y) * dy2);

      let uv1 = XVector2.lerpf(uvLeft, uvRight, (y - left.y) * dy1);
      let uv2 = XVector2.lerpf(aUV, cUV, (y - ai.y) * dy2);

      if (x1 > x2) {
        [x1, x2] = [x2, x1];
        [z1, z2] = [z2, z1];
        [uv1, uv2] = [uv2, uv1];
      }

      const fromX = Math.max(0, Math.ceil(x1));
      const toX = Math.min(Width - 1, Math.floor(x2));

      for (let x = fromX; x <= toX; x++) {
        const t = (x - x1) / (x2 - x1 || 1);
        const z = lerpf(z1, z2, t);
        if (z > 0) continue;

        const zBufferIndex = y * Width + x;
        if (ZBuffer[zBufferIndex] < z) {
          ZBuffer[zBufferIndex] = z;
          const uv = XVector2.lerpf(uv1, uv2, t);
          let r = 0, g = 0, b = 0, a = 0;
          // Do something with UV o_O
          set(x, y, { r, g, b, a });
        }
      }
    }
  };

  if (!UseFastRender || bi.y !== ai.y) fillTrianglePart(ai, bi, aUV, bUV);
  if (!UseFastRender || bi.y !== ci.y) fillTrianglePart(bi, ci, bUV, cUV);
}

const getImageData = () => Screen;
const getDepthData = (): ImageData => {
  const { data: outData } = ZBufferImageData;

  for (let i = 0, j = 0; i < Size; i += 4, j++) {
    const bufValue = ZBuffer[j];
    const value = Number.isFinite(bufValue) ? 255 - clamp255(-bufValue >> 2) : 0;
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
  get,

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