import type { TShaderUserData } from './TShaderUserData';
import type { TVertexShader } from './TVertexShader';
import type { TFragmentShader } from './TFragmentShader';

export type TMaterial = {
  userData: TShaderUserData;
  vertexShader: TVertexShader;
  fragmentShader: TFragmentShader;
};