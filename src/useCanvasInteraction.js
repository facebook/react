// @flow

import type {Point} from './layout';

import {useEffect} from 'react';

export type VerticalPanStartInteraction = {|
  type: 'vertical-pan-start',
  payload: {|
    event: MouseEvent,
    location: Point,
  |},
|};
export type VerticalPanMoveInteraction = {|
  type: 'vertical-pan-move',
  payload: {|
    event: MouseEvent,
    location: Point,
  |},
|};
export type VerticalPanEndInteraction = {|
  type: 'vertical-pan-end',
  payload: {|
    event: MouseEvent,
    location: Point,
  |},
|};
export type HorizontalPanStartInteraction = {|
  type: 'horizontal-pan-start',
  payload: {|
    event: MouseEvent,
    location: Point,
  |},
|};
export type HorizontalPanMoveInteraction = {|
  type: 'horizontal-pan-move',
  payload: {|
    event: MouseEvent,
    location: Point,
  |},
|};
export type HorizontalPanEndInteraction = {|
  type: 'horizontal-pan-end',
  payload: {|
    event: MouseEvent,
    location: Point,
  |},
|};
export type HoverInteraction = {|
  type: 'hover',
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
  | VerticalPanStartInteraction
  | VerticalPanMoveInteraction
  | VerticalPanEndInteraction
  | HorizontalPanStartInteraction
  | HorizontalPanMoveInteraction
  | HorizontalPanEndInteraction
  | HoverInteraction
  | WheelPlainInteraction
  | WheelWithShiftInteraction
  | WheelWithControlInteraction
  | WheelWithMetaInteraction;

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
      const canvasRect = canvas.getBoundingClientRect();
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
        type: 'horizontal-pan-start',
        payload: {
          event,
          location: localToCanvasCoordinates({x: event.x, y: event.y}),
        },
      });
      interactor({
        type: 'vertical-pan-start',
        payload: {
          event,
          location: localToCanvasCoordinates({x: event.x, y: event.y}),
        },
      });
    };

    const onCanvasMouseMove: MouseEventHandler = event => {
      interactor({
        type: 'horizontal-pan-move',
        payload: {
          event,
          location: localToCanvasCoordinates({x: event.x, y: event.y}),
        },
      });
      interactor({
        type: 'vertical-pan-move',
        payload: {
          event,
          location: localToCanvasCoordinates({x: event.x, y: event.y}),
        },
      });
      interactor({
        type: 'hover',
        payload: {
          event,
          location: localToCanvasCoordinates({x: event.x, y: event.y}),
        },
      });
    };

    const onDocumentMouseUp: MouseEventHandler = event => {
      interactor({
        type: 'horizontal-pan-end',
        payload: {
          event,
          location: localToCanvasCoordinates({x: event.x, y: event.y}),
        },
      });
      interactor({
        type: 'vertical-pan-end',
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
