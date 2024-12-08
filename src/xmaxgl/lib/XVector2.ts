import type { TVector2 } from '../types/TVector2';

export class XVector2 {
  public x: number;
  public y: number;

  public constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public get sqrMagniture(): number {
    const { x, y } = this;
    return x * x + y * y;
  }

  public get magnitude(): number {
    const { x, y } = this;
    return Math.sqrt(x * x + y * y);
  }

  public get radians(): number {
    return Math.atan2(this.y, this.x);
  }

  public get raw(): TVector2 {
    return { x: this.x, y: this.y };
  }

  public get array(): [number, number] {
    return [this.x, this.y];
  }

  public clone() {
    return new XVector2(this.x, this.y);
  }

  public copy(v: TVector2) {
    return new XVector2(v.x, v.y);
  }

  public set(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  }

  public addf(x: number, y: number) {
    this.x += x;
    this.y += y;
    return this;
  }

  public add(v: TVector2) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  public subf(x: number, y: number) {
    this.x -= x;
    this.y -= y;
    return this;
  }

  public sub(v: TVector2) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  public scalen(n: number) {
    this.x *= n;
    this.y *= n;
    return this;
  }

  public scalef(x: number, y: number) {
    this.x *= x;
    this.y *= y;
    return this;
  }

  public scale(v: TVector2) {
    this.x *= v.x;
    this.y *= v.y;
    return this;
  }

  public divn(n: number) {
    this.x /= n;
    this.y /= n;
    return this;
  }

  public divf(x: number, y: number) {
    this.x /= x;
    this.y /= y;
    return this;
  }

  public div(v: TVector2) {
    this.x /= v.x;
    this.y /= v.y;
    return this;
  }

  public static fromRaw(v: TVector2) {
    return new XVector2(v.x, v.y);
  }

  public static fromArray(v: number[]) {
    return new XVector2(v[0] ?? 0, v[1] ?? 0);
  }
}