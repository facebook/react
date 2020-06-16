// @flow

import memoize from 'memoize-one';

// hidpi canvas: https://www.html5rocks.com/en/tutorials/canvas/hidpi/
export function configureRetinaCanvas(
  canvas: HTMLCanvasElement,
  height: number,
  width: number
): number {
  const dpr: number = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  return dpr;
}

export const getCanvasContext = memoize(
  (
    canvas: HTMLCanvasElement,
    height: number,
    width: number,
    scaleCanvas: boolean = true
  ): CanvasRenderingContext2D => {
    const context = canvas.getContext('2d', { alpha: false });
    if (scaleCanvas) {
      const dpr = configureRetinaCanvas(canvas, height, width);
      // Scale all drawing operations by the dpr, so you don't have to worry about the difference.
      context.scale(dpr, dpr);
    }
    return context;
  }
);

export function getCanvasMousePos(
  canvas: HTMLCanvasElement,
  mouseEvent: MouseEvent
) {
  const rect =
    canvas instanceof HTMLCanvasElement
      ? canvas.getBoundingClientRect()
      : { left: 0, top: 0 };
  const canvasMouseX = mouseEvent.clientX - rect.left;
  const canvasMouseY = mouseEvent.clientY - rect.top;

  return { canvasMouseX, canvasMouseY };
}
