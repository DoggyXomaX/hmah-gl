import type { TVector3 } from './TVector3';
import type { TVector2 } from './TVector2';

export type TSurface = {
  points: TVector3[];
  polys: number[];
  uvs: TVector2[];
};