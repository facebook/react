// @flow

import type {Point} from './layout';

import {useEffect} from 'react';

export type MouseDownInteraction = {|
  type: 'mousedown',
  payload: {|
    event: MouseEvent,
    location: Point,
  |},
|};
export type MouseMoveInteraction = {|
  type: 'mousemove',
  payload: {|
    event: MouseEvent,
    location: Point,
  |},
|};
export type MouseUpInteraction = {|
  type: 'mouseup',
  payload: {|
    event: MouseEvent,
    location: Point,
  |},
|};
export type WheelPlainInteraction = {|
  type: 'wheel-plain',
  payload: {|
    event: WheelEvent,
    location: Point,
  |},
|};
export type WheelWithShiftInteraction = {|
  type: 'wheel-shift',
  payload: {|
    event: WheelEvent,
    location: Point,
  |},
|};
export type WheelWithControlInteraction = {|
  type: 'wheel-control',
  payload: {|
    event: WheelEvent,
    location: Point,
  |},
|};
export type WheelWithMetaInteraction = {|
  type: 'wheel-meta',
  payload: {|
    event: WheelEvent,
    location: Point,
  |},
|};

export type Interaction =
  | MouseDownInteraction
  | MouseMoveInteraction
  | MouseUpInteraction
  | WheelPlainInteraction
  | WheelWithShiftInteraction
  | WheelWithControlInteraction
  | WheelWithMetaInteraction;

let canvasBoundingRectCache = null;
function cacheFirstGetCanvasBoundingRect(canvas) {
  if (
    canvasBoundingRectCache &&
    canvas.width === canvasBoundingRectCache.width &&
    canvas.height === canvasBoundingRectCache.height
  ) {
    return canvasBoundingRectCache.rect;
  }
  canvasBoundingRectCache = {
    width: canvas.width,
    height: canvas.height,
    rect: canvas.getBoundingClientRect(),
  };
  return canvasBoundingRectCache.rect;
}

export function useCanvasInteraction(
  canvasRef: {|current: HTMLCanvasElement | null|},
  interactor: (interaction: Interaction) => void,
) {
  useEffect(() => {
    const canvas = canvasRef.current;

    function localToCanvasCoordinates(localCoordinates: Point): Point {
      if (!canvas) {
        return localCoordinates;
      }
      const canvasRect = cacheFirstGetCanvasBoundingRect(canvas);
      return {
        x: localCoordinates.x - canvasRect.left,
        y: localCoordinates.y - canvasRect.top,
      };
    }

    if (!(canvas instanceof HTMLCanvasElement)) {
      console.error('canvas is not a HTMLCanvasElement!', canvas);
      return;
    }

    const onCanvasMouseDown: MouseEventHandler = event => {
      interactor({
        type: 'mousedown',
        payload: {
          event,
          location: localToCanvasCoordinates({x: event.x, y: event.y}),
        },
      });
    };

    const onCanvasMouseMove: MouseEventHandler = event => {
      interactor({
        type: 'mousemove',
        payload: {
          event,
          location: localToCanvasCoordinates({x: event.x, y: event.y}),
        },
      });
    };

    const onDocumentMouseUp: MouseEventHandler = event => {
      interactor({
        type: 'mouseup',
        payload: {
          event,
          location: localToCanvasCoordinates({x: event.x, y: event.y}),
        },
      });
    };

    const onCanvasWheel: WheelEventHandler = event => {
      event.preventDefault();
      event.stopPropagation();

      if (event.shiftKey) {
        interactor({
          type: 'wheel-shift',
          payload: {
            event,
            location: localToCanvasCoordinates({x: event.x, y: event.y}),
          },
        });
      } else if (event.ctrlKey) {
        interactor({
          type: 'wheel-control',
          payload: {
            event,
            location: localToCanvasCoordinates({x: event.x, y: event.y}),
          },
        });
      } else if (event.metaKey) {
        interactor({
          type: 'wheel-meta',
          payload: {
            event,
            location: localToCanvasCoordinates({x: event.x, y: event.y}),
          },
        });
      } else {
        interactor({
          type: 'wheel-plain',
          payload: {
            event,
            location: localToCanvasCoordinates({x: event.x, y: event.y}),
          },
        });
      }

      return false;
    };

    document.addEventListener('mouseup', onDocumentMouseUp);

    canvas.addEventListener('wheel', onCanvasWheel);
    canvas.addEventListener('mousedown', onCanvasMouseDown);
    canvas.addEventListener('mousemove', onCanvasMouseMove);

    return () => {
      document.removeEventListener('mouseup', onDocumentMouseUp);

      canvas.removeEventListener('wheel', onCanvasWheel);
      canvas.removeEventListener('mousedown', onCanvasMouseDown);
      canvas.removeEventListener('mousemove', onCanvasMouseMove);
    };
  }, [canvasRef, interactor]);
}
