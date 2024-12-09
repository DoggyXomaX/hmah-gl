import type { TColor } from './types/TColor';
import type { TVector3 } from './types/TVector3';
import type { TVector2 } from './types/TVector2';
import type { TTexture } from './types/TTexture';

import { clamp255, lerpf } from './lib/XMath';
import { XVector3 } from './lib/XVector3';
import { XVector2 } from './lib/XVector2';

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
    r = Screen.data[i];
    g = Screen.data[i + 1];
    b = Screen.data[i + 2];
    a = Screen.data[i + 3];
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
  if (a.y < b.y) [a, b] = [b, a];
  if (a.y < c.y) [a, c] = [c, a];
  if (b.y < c.y) [b, c] = [c, b];

  const fillTrianglePart = (yStart: number, yEnd: number, left: TVector3, right: TVector3) => {
    const fromY = Math.max(0, Math.ceil(yEnd));
    const toY = Math.min(Height - 1, Math.floor(yStart));

    const dy1 = 1 / (right.y - left.y);
    const dy2 = 1 / (c.y - a.y);

    for (let y = fromY; y <= toY; y++) {
      let { x: x1, z: z1 } = XVector3.lerpf(left, right, (y - left.y) * dy1);
      let { x: x2, z: z2} = XVector3.lerpf(a, c, (y - a.y) * dy2);

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

  fillTrianglePart(a.y, b.y, a, b);
  fillTrianglePart(b.y, c.y, b, c);
};

const fillTextureTriangle = (
  a: TVector3, b: TVector3, c: TVector3,
  aUV: TVector2, bUV: TVector2, cUV: TVector2,
  texture: TTexture,
) => {
  const { width: tWidth, height: tHeight, data: tData } = texture;

  if (a.y < b.y) {
    [a, b] = [b, a];
    [aUV, bUV] = [bUV, aUV];
  }
  if (a.y < c.y) {
    [a, c] = [c, a];
    [aUV, cUV] = [cUV, aUV];
  }
  if (b.y < c.y) {
    [b, c] = [c, b];
    [bUV, cUV] = [cUV, bUV];
  }

  const { x: ax, y: ay, z: az } = a;
  const { x: cx, y: cy, z: cz } = c;
  const { x: aU, y: aV } = aUV;
  const { x: cU, y: cV } = cUV;

  const fillTrianglePart = (
    left: TVector3, right: TVector3,
    uvLeft: TVector2, uvRight: TVector2,
  ) => {
    const { x: leftX, y: leftY, z: leftZ } = left;
    const { x: rightX, y: rightY, z: rightZ } = right;
    const { x: uLeft, y: vLeft } = uvLeft;
    const { x: uRight, y: vRight } = uvRight;

    const fromY = Math.max(0, Math.ceil(rightY));
    const toY = Math.min(Height - 1, Math.floor(leftY));

    const dy1 = 1 / (rightY - leftY);
    const dy2 = 1 / (cy - ay);

    for (let y = fromY; y <= toY; y++) {
      const t1 = (y - leftY) * dy1;
      const t2 = (y - ay) * dy2;
      let x1 = leftX + (rightX - leftX) * t1;
      let z1 = leftZ + (rightZ - leftZ) * t1;
      let u1 = uLeft + (uRight - uLeft) * t1;
      let v1 = vLeft + (vRight - vLeft) * t1;
      let x2 = ax + (cx - ax) * t2;
      let z2 = az + (cz - az) * t2;
      let u2 = aU + (cU - aU) * t2;
      let v2 = aV + (cV - aV) * t2;

      if (x1 > x2) {
        let t = x1; x1 = x2; x2 = t;
        t = z1; z1 = z2; z2 = t;
        t = u1; u1 = u2; u2 = t;
        t = v1; v1 = v2; v2 = t;
      }

      const fromX = Math.max(0, (x1 + 0.5) | 0);
      const toX = Math.min(Width - 1, x2 | 0);

      for (let x = fromX; x <= toX; x++) {
        const t = (x - x1) / (x2 - x1 || 1);
        const z = z1 + (z2 - z1) * t;
        if (z > 0) continue;

        const zBufferIndex = y * Width + x;
        if (ZBuffer[zBufferIndex] < z) {
          ZBuffer[zBufferIndex] = z;

          const u = u1 + (u2 - u1) * t;
          const v = v1 + (v2 - v1) * t;

          const tx = ((u * tWidth) | 0) % tWidth;
          const ty = ((v * tHeight) | 0) % tHeight;
          const ti = (ty * tWidth + tx) << 2;

          set(x, y, {
            r: tData[ti],
            g: tData[ti + 1],
            b: tData[ti + 2],
            a: tData[ti + 3],
          });
        }
      }
    }
  };

  fillTrianglePart(a, b, aUV, bUV);
  fillTrianglePart(b, c, bUV, cUV);
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
  fillTextureTriangle,

  getImageData,
  getDepthData,
  getWidth,
  getHeight,
  setColor,
};