import type { TSurface } from './TSurface';
import type { TMaterial } from './TMaterial';
import type { TColor } from './TColor';

export type TMeshPart = { surface: TSurface; color?: TColor; material?: TMaterial };