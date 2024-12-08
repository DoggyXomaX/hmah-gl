const clamp = (x: number, min: number, max: number) => x < min ? min : x > max ? max : x;
const clamp01 = (x: number) => x < 0 ? 0 : x > 1 ? 1 : x;
const clamp255 = (x: number) => x < 0 ? 0 : x > 255 ? 255 : x;
const lerpUnclamped = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);
const equals = (a: number, b: number, precision: number = 0.01) => Math.abs(a - b) <= precision;

export const XMath = {
  clamp,
  clamp01,
  clamp255,
  lerpf: lerpUnclamped,
  lerp,
  equals,
};