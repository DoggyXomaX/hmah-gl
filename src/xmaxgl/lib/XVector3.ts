import type { TVector3 } from '../types/TVector3';

export class XVector3 {
  public x: number;
  public y: number;
  public z: number;

  public constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  public get sqrMagniture(): number {
    const { x, y, z } = this;
    return x * x + y * y + z * z;
  }

  public get magnitude(): number {
    const { x, y, z } = this;
    return Math.sqrt(x * x + y * y + z * z);
  }

  public get raw(): TVector3 {
    return { x: this.x, y: this.y, z: this.z };
  }

  public get array(): [number, number, number] {
    return [this.x, this.y, this.z];
  }

  public clone() {
    return new XVector3(this.x, this.y, this.z);
  }

  public copy(v: TVector3) {
    return new XVector3(v.x, v.y, v.z);
  }

  public setf(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  public set(v: TVector3) {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  public addf(x: number, y: number, z: number) {
    this.x += x;
    this.y += y;
    this.z += z;
    return this;
  }

  public add(v: TVector3) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  public subf(x: number, y: number, z: number) {
    this.x -= x;
    this.y -= y;
    this.z -= z;
    return this;
  }

  public sub(v: TVector3) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  public scalen(n: number) {
    this.x *= n;
    this.y *= n;
    this.z *= n;
    return this;
  }

  public scalef(x: number, y: number, z: number) {
    this.x *= x;
    this.y *= y;
    this.z *= z;
    return this;
  }

  public scale(v: TVector3) {
    this.x *= v.x;
    this.y *= v.y;
    this.z *= v.z;
    return this;
  }

  public divn(n: number) {
    this.x /= n;
    this.y /= n;
    this.z /= n;
    return this;
  }

  public divf(x: number, y: number, z: number) {
    this.x /= x;
    this.y /= y;
    this.z /= z;
    return this;
  }

  public div(v: TVector3) {
    this.x /= v.x;
    this.y /= v.y;
    this.z /= v.z;
    return this;
  }

  public static lerpf(a: TVector3, b: TVector3, t: number) {
    return new XVector3(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t,
      a.z + (b.z - a.z) * t,
    );
  }

  public static lerp(a: TVector3, b: TVector3, t: number) {
    t = Math.min(1, Math.max(0, t));
    return new XVector3(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t,
      a.z + (b.z - a.z) * t,
    );
  }

  public static fromRaw(v: TVector3) {
    return new XVector3(v.x, v.y, v.z);
  }

  public static fromArray(v: number[]) {
    return new XVector3(v[0] ?? 0, v[1] ?? 0, v[2] ?? 0);
  }
}