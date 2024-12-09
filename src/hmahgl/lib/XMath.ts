export const clamp = (x: number, min: number, max: number) => x < min ? min : x > max ? max : x;
export const clamp01 = (x: number) => x < 0 ? 0 : x > 1 ? 1 : x;
export const clamp255 = (x: number) => x < 0 ? 0 : x > 255 ? 255 : x;
export const lerpf = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp01(t);
export const equals = (a: number, b: number, precision: number = 0.01) => Math.abs(a - b) <= precision;
export const max = (a: number, b: number) => a > b ? a : b;
export const min = (a: number, b: number) => a < b ? a : b;