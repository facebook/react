import { useEffect, useReducer } from 'react';
import { getCanvasMousePos } from './canvasUtils';
import {
  BAR_HORIZONTAL_SPACING,
  MAX_ZOOM_LEVEL,
  MIN_BAR_WIDTH,
  MIN_ZOOM_LEVEL,
  MOVE_WHEEL_DELTA_THRESHOLD,
  ZOOM_WHEEL_DELTA_THRESHOLD,
} from './constants';

const initialState = {
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
export function positionToTimestamp(position, state) {
  return (position - state.fixedColumnWidth + state.offsetX) / state.zoomLevel;
}

// TODO Account for fixed label width
export function timestampToPosition(timestamp, state) {
  return timestamp * state.zoomLevel + state.fixedColumnWidth - state.offsetX;
}

export function durationToWidth(duration, state) {
  return Math.max(
    duration * state.zoomLevel - BAR_HORIZONTAL_SPACING,
    MIN_BAR_WIDTH
  );
}

function getMaxOffsetX(state) {
  return (
    state.unscaledContentWidth * state.zoomLevel -
    state.canvasWidth +
    state.fixedColumnWidth
  );
}

function getMaxOffsetY(state) {
  return (
    state.unscaledContentHeight - state.canvasHeight + state.fixedHeaderHeight
  );
}

function reducer(state, action) {
  const { payload, type } = action;
  switch (type) {
    case 'initialize':
      return {
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
      };
    case 'mouse-down':
      return {
        ...state,
        isDragging: true,
      };
    case 'mouse-move':
      const { canvasMouseX, canvasMouseY } = getCanvasMousePos(
        payload.canvas,
        payload.event
      );

      if (state.isDragging) {
        return {
          ...state,
          canvasMouseX,
          canvasMouseY,
          offsetX: clamp(
            0,
            getMaxOffsetX(state),
            state.offsetX - payload.event.movementX
          ),
          offsetY: clamp(
            0,
            getMaxOffsetY(state),
            state.offsetY + payload.event.movementY
          ),
        };
      } else {
        return {
          ...state,
          canvasMouseX,
          canvasMouseY,
        };
      }
    case 'mouse-up':
      return {
        ...state,
        isDragging: false,
      };
    case 'wheel':
      const { canvas, event } = payload;
      const { deltaX, deltaY } = event;
      const {
        minZoomLevel,
        offsetX,
        offsetY,
        unscaledContentHeight,
        unscaledContentWidth,
        zoomLevel,
      } = state;

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
            const { canvasMouseX } = getCanvasMousePos(canvas, event);

            const nextState = {
              ...state,
              zoomLevel: clamp(
                minZoomLevel,
                MAX_ZOOM_LEVEL,
                zoomLevel * (1 + 0.005 * -deltaY)
              ),
            };

            // Determine what point in time the mouse is currently centered over,
            // and adjust the offset so that point stays centered after zooming.
            const timestampAtCurrentZoomLevel = positionToTimestamp(
              canvasMouseX,
              state
            );
            const positionAtNewZoom = timestampToPosition(
              timestampAtCurrentZoomLevel,
              nextState
            );

            nextState.offsetX = clamp(
              0,
              getMaxOffsetX(nextState),
              offsetX + positionAtNewZoom - canvasMouseX
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
    case 'zoom-to':
      const { startTime, stopTime } = payload;
      const { canvasWidth, fixedColumnWidth } = state;

      const availableWidth = canvasWidth - fixedColumnWidth;
      const newZoomLevel = availableWidth / (stopTime - startTime);

      return {
        ...state,
        offsetX: newZoomLevel * startTime,
        zoomLevel: newZoomLevel,
      };
      break;
    default:
      throw Error(`Unexpected type "${type}"`);
  }

  return state;
}

function clamp(min, max, value) {
  if (Number.isNaN(min) || Number.isNaN(max) || Number.isNaN(value)) {
    debugger;
  }
  return Math.max(min, Math.min(max, value));
}

// Inspired by https://github.com/jsdf/flamechart
export default function usePanAndZoom({
  canvasRef,
  canvasHeight,
  canvasWidth,
  fixedColumnWidth,
  fixedHeaderHeight,
  unscaledContentWidth,
  unscaledContentHeight,
}) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    zoomTo: (startTime, stopTime) =>
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
      (width - fixedColumnWidth) / unscaledContentWidth
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

    const onCanvasMouseDown = event => {
      dispatch({ type: 'mouse-down' });
    };

    const onCanvasMouseMove = event => {
      dispatch({
        type: 'mouse-move',
        payload: {
          canvas: canvasRef.current,
          event,
        },
      });
    };

    const onDocumentMouseUp = event => {
      dispatch({ type: 'mouse-up' });
    };

    const onCanvasWheel = event => {
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

    if (canvas instanceof HTMLCanvasElement) {
      canvas.addEventListener('wheel', onCanvasWheel);
      canvas.addEventListener('mousedown', onCanvasMouseDown);
      canvas.addEventListener('mousemove', onCanvasMouseMove);
    }

    return () => {
      document.removeEventListener('mouseup', onDocumentMouseUp);

      if (canvas instanceof HTMLCanvasElement) {
        canvas.removeEventListener('wheel', onCanvasWheel);
        canvas.removeEventListener('mousedown', onCanvasMouseDown);
        canvas.removeEventListener('mousemove', onCanvasMouseMove);
      }
    };
  }, [canvasRef]);

  return state;
}
