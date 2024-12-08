import type { TVector3 } from './TVector3';
import type { TShaderUserData } from './TShaderUserData';
import type { TColor } from './TColor';

export type TFragmentShader = (point: TVector3, userData: TShaderUserData) => TColor;