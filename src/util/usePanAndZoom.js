// @flow

import {useEffect, useReducer} from 'react';
import {getCanvasMousePos} from '../canvas/canvasUtils';
import {
  BAR_HORIZONTAL_SPACING,
  MAX_ZOOM_LEVEL,
  MIN_BAR_WIDTH,
  MIN_ZOOM_LEVEL,
  MOVE_WHEEL_DELTA_THRESHOLD,
  ZOOM_WHEEL_DELTA_THRESHOLD,
} from '../canvas/constants';

export type PanAndZoomState = {|
  canvasHeight: number,
  canvasWidth: number,
  canvasMouseX: number,
  canvasMouseY: number,
  fixedColumnWidth: number,
  fixedHeaderHeight: number,
  isDragging: boolean,
  minZoomLevel: number,
  offsetX: number,
  offsetY: number,
  unscaledContentHeight: number,
  unscaledContentWidth: number,
  zoomLevel: number,
  zoomTo: null | ((startTime: number, endTime: number) => void),
|};

const initialState: PanAndZoomState = {
  canvasHeight: 0,
  canvasWidth: 0,
  canvasMouseX: 0,
  canvasMouseY: 0,
  fixedColumnWidth: 0,
  fixedHeaderHeight: 0,
  isDragging: false,
  minZoomLevel: 1,
  offsetX: 0,
  offsetY: 0,
  unscaledContentHeight: 0,
  unscaledContentWidth: 0,
  zoomLevel: 1,
  zoomTo: null,
};

// TODO Account for fixed label width
export function positionToTimestamp(
  position: number,
  state: $ReadOnly<PanAndZoomState>,
) {
  return (position - state.fixedColumnWidth + state.offsetX) / state.zoomLevel;
}

// TODO Account for fixed label width
export function timestampToPosition(
  timestamp: number,
  state: $ReadOnly<PanAndZoomState>,
) {
  return timestamp * state.zoomLevel + state.fixedColumnWidth - state.offsetX;
}

export function durationToWidth(
  duration: number,
  state: $ReadOnly<PanAndZoomState>,
) {
  return Math.max(
    duration * state.zoomLevel - BAR_HORIZONTAL_SPACING,
    MIN_BAR_WIDTH,
  );
}

function getMaxOffsetX(state: $ReadOnly<PanAndZoomState>) {
  return (
    state.unscaledContentWidth * state.zoomLevel -
    state.canvasWidth +
    state.fixedColumnWidth
  );
}

function getMaxOffsetY(state: $ReadOnly<PanAndZoomState>) {
  return (
    state.unscaledContentHeight - state.canvasHeight + state.fixedHeaderHeight
  );
}

type InitializeAction = {|
  type: 'initialize',
  payload: $Shape<PanAndZoomState>,
|};
type MouseDownAction = {|
  type: 'mouse-down',
|};
type MouseMoveAction = {|
  type: 'mouse-move',
  payload: {|
    canvas: HTMLCanvasElement,
    event: MouseEvent,
  |},
|};
type MouseUpAction = {|
  type: 'mouse-up',
|};
type WheelAction = {|
  type: 'wheel',
  payload: {|
    canvas: HTMLCanvasElement,
    event: WheelEvent,
  |},
|};
type ZoomToAction = {|
  type: 'zoom-to',
  payload: {|
    startTime: number,
    stopTime: number,
  |},
|};

function reducer(
  state: PanAndZoomState,
  action:
    | InitializeAction
    | MouseDownAction
    | MouseMoveAction
    | MouseUpAction
    | WheelAction
    | ZoomToAction,
): PanAndZoomState {
  switch (action.type) {
    case 'initialize': {
      const {payload} = action;
      return ({
        ...state,
        canvasHeight: payload.canvasHeight,
        canvasWidth: payload.canvasWidth,
        fixedColumnWidth: payload.fixedColumnWidth,
        fixedHeaderHeight: payload.fixedHeaderHeight,
        minZoomLevel: payload.minZoomLevel,
        unscaledContentHeight: payload.unscaledContentHeight,
        unscaledContentWidth: payload.unscaledContentWidth,
        zoomLevel: payload.zoomLevel,
        offsetX: clamp(0, getMaxOffsetX(state), state.offsetX),
        offsetY: clamp(0, getMaxOffsetY(state), state.offsetY),
      }: PanAndZoomState);
    }
    case 'mouse-down': {
      return {
        ...state,
        isDragging: true,
      };
    }
    case 'mouse-move': {
      const {payload} = action;
      const {canvasMouseX, canvasMouseY} = getCanvasMousePos(
        payload.canvas,
        payload.event,
      );

      if (state.isDragging) {
        return {
          ...state,
          canvasMouseX,
          canvasMouseY,
          offsetX: clamp(
            0,
            getMaxOffsetX(state),
            state.offsetX - payload.event.movementX,
          ),
          offsetY: clamp(
            0,
            getMaxOffsetY(state),
            state.offsetY + payload.event.movementY,
          ),
        };
      } else {
        return {
          ...state,
          canvasMouseX,
          canvasMouseY,
        };
      }
    }
    case 'mouse-up': {
      return {
        ...state,
        isDragging: false,
      };
    }
    case 'wheel': {
      const {payload} = action;
      const {canvas, event} = payload;
      const {deltaX, deltaY} = event;
      const {minZoomLevel, offsetX, offsetY, zoomLevel} = state;

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > absDeltaY) {
        if (absDeltaX > MOVE_WHEEL_DELTA_THRESHOLD) {
          return {
            ...state,
            offsetX: clamp(0, getMaxOffsetX(state), offsetX + deltaX),
          };
        }
      } else {
        if (event.shiftKey || event.ctrlKey || event.metaKey) {
          if (absDeltaY > ZOOM_WHEEL_DELTA_THRESHOLD) {
            const {canvasMouseX} = getCanvasMousePos(canvas, event);

            const nextState: PanAndZoomState = {
              ...state,
              zoomLevel: clamp(
                minZoomLevel,
                MAX_ZOOM_LEVEL,
                zoomLevel * (1 + 0.005 * -deltaY),
              ),
            };

            // Determine what point in time the mouse is currently centered over,
            // and adjust the offset so that point stays centered after zooming.
            const timestampAtCurrentZoomLevel = positionToTimestamp(
              canvasMouseX,
              state,
            );
            const positionAtNewZoom = timestampToPosition(
              timestampAtCurrentZoomLevel,
              nextState,
            );

            nextState.offsetX = clamp(
              0,
              getMaxOffsetX(nextState),
              offsetX + positionAtNewZoom - canvasMouseX,
            );

            if (nextState.zoomLevel !== zoomLevel) {
              return nextState;
            }
          }
        } else {
          if (absDeltaY > MOVE_WHEEL_DELTA_THRESHOLD) {
            return {
              ...state,
              offsetY: clamp(0, getMaxOffsetY(state), offsetY + deltaY),
            };
          }
        }
      }
      break;
    }
    case 'zoom-to': {
      const {payload} = action;
      const {startTime, stopTime} = payload;
      const {canvasWidth, fixedColumnWidth} = state;

      const availableWidth = canvasWidth - fixedColumnWidth;
      const newZoomLevel = availableWidth / (stopTime - startTime);

      return {
        ...state,
        offsetX: newZoomLevel * startTime,
        zoomLevel: newZoomLevel,
      };
    }
    default:
      throw Error(`Unexpected type "${action.type}"`);
  }

  return state;
}

function clamp(min: number, max: number, value: number): number {
  if (Number.isNaN(min) || Number.isNaN(max) || Number.isNaN(value)) {
    throw new Error(
      `Clamp was called with NaN. Args: min: ${min}, max: ${max}, value: ${value}.`,
    );
  }
  return Math.max(min, Math.min(max, value));
}

type Props = {|
  canvasRef: {|current: HTMLCanvasElement | null|},
  canvasHeight: number,
  canvasWidth: number,
  fixedColumnWidth: number,
  fixedHeaderHeight: number,
  unscaledContentWidth: number,
  unscaledContentHeight: number,
|};

// Inspired by https://github.com/jsdf/flamechart
export default function usePanAndZoom({
  canvasRef,
  canvasHeight,
  canvasWidth,
  fixedColumnWidth,
  fixedHeaderHeight,
  unscaledContentWidth,
  unscaledContentHeight,
}: Props) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    zoomTo: (startTime: number, stopTime: number) =>
      dispatch({
        type: 'zoom-to',
        payload: {
          startTime,
          stopTime,
        },
      }),
  });

  // TODO This effect should run any time width or unscaledContentWidth changes
  useEffect(() => {
    const width = canvasWidth;

    const initialZoomLevel = clamp(
      MIN_ZOOM_LEVEL,
      MAX_ZOOM_LEVEL,
      (width - fixedColumnWidth) / unscaledContentWidth,
    );

    dispatch({
      type: 'initialize',
      payload: {
        canvasHeight,
        canvasWidth,
        fixedColumnWidth,
        fixedHeaderHeight,
        minZoomLevel: initialZoomLevel,
        unscaledContentHeight,
        unscaledContentWidth,
        zoomLevel: initialZoomLevel,
      },
    });
  }, [
    canvasHeight,
    canvasWidth,
    fixedHeaderHeight,
    fixedColumnWidth,
    unscaledContentHeight,
    unscaledContentWidth,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!(canvas instanceof HTMLCanvasElement)) {
      console.error('canvas is not a HTMLCanvasElement!', canvas);
      return;
    }

    const onCanvasMouseDown: MouseEventHandler = event => {
      dispatch({type: 'mouse-down'});
    };

    const onCanvasMouseMove: MouseEventHandler = event => {
      dispatch({
        type: 'mouse-move',
        payload: {
          canvas,
          event,
        },
      });
    };

    const onDocumentMouseUp: MouseEventHandler = event => {
      dispatch({type: 'mouse-up'});
    };

    const onCanvasWheel: WheelEventHandler = event => {
      event.preventDefault();
      event.stopPropagation();

      dispatch({
        type: 'wheel',
        payload: {
          canvas,
          event,
        },
      });

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
  }, [canvasRef]);

  return state;
}
