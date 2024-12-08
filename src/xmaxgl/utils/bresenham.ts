export const bresenhamLine = (x0: number, y0: number, x1: number, y1: number, plot: (x: number, y: number) => void) => {
  let deltaX = Math.abs(x1 - x0);
  let deltaY = Math.abs(y1 - y0);
  let error = 0;
  let deltaErr = deltaY + 1;
  let y = y0;

  let dirY = y1 - y0;
  if (dirY > 0) dirY = 1;
  else if (dirY < 0) dirY = -1;

  for (let x = x0; x <= x1; x++) {
    plot(x, y);
    error += deltaErr;
    if (error >= deltaX + 1) {
      y += dirY;
      error -= deltaX + 1;
    }
  }
};