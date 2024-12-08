import type { TVector2 } from '../types/TVector2';

export class XVector2 {
  public x: number;
  public y: number;

  public constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public '+'(xOrOther: TVector2, y?: number) {

  }
}