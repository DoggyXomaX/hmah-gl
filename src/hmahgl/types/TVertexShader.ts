import type { TVector3 } from './TVector3';
import type { TShaderUserData } from './TShaderUserData';

export type TVertexShader = (point: TVector3, userData: TShaderUserData) => TVector3;