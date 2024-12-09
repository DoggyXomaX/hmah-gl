import type { TTexture } from './types/TTexture';

const textures: TTexture[] = [];

const loadImage = async (url: string): Promise<HTMLImageElement | undefined> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => {
      console.error(`Failed to load ${url}: ${e}`);
      return resolve(undefined);
    };
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
};

const loadTexture = async (url: string): Promise<TTexture | undefined> => {
  const image = await loadImage(url);
  if (!image) return;

  const { naturalWidth: width, naturalHeight: height } = image;

  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) {
    console.error('Failed to get offscreen context');
    return;
  }

  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, width, height);
  return { data, width, height };
};

const addTexture = (texture: TTexture, i?: number): void => {
  if (i != null) {
    textures[i] = texture;
  } else {
    textures.push(texture);
  }
};

const clear = () => {
  textures.length = 0;
};

const resize = (size: number) => {
  textures.length = size;
};

export const XTextures = {
  textures,
  loadTexture,
  addTexture,
  clear,
  resize,
};