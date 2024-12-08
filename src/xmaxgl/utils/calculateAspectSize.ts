export const calculateAspectSize = (
  width: number,
  height: number,
  targetWidth: number,
  targetHeight: number
): { width: number; height: number } => {
  const aspect = targetWidth / targetHeight;
  if (width / height < aspect) {
    return { width, height: width * (1 / aspect) };
  } else {
    return { width: height * aspect, height };
  }
};