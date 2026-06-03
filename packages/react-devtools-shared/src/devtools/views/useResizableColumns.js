/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {useEffect, useLayoutEffect, useReducer, useRef} from 'react';
import {
  localStorageGetItem,
  localStorageSetItem,
} from 'react-devtools-shared/src/storage';

import typeof {SyntheticPointerEvent} from 'react-dom-bindings/src/events/SyntheticEvent';

type Orientation = 'horizontal' | 'vertical';

type ResizeAction = {
  type: 'ACTION_SET_HORIZONTAL_PERCENTAGE' | 'ACTION_SET_VERTICAL_PERCENTAGE',
  payload: number,
};

type ResizeState = {
  horizontalPercentage: number,
  verticalPercentage: number,
};

// Must match the CSS @container query breakpoint in
// Components/Components.css and Profiler/Profiler.css.
const VERTICAL_MODE_MAX_WIDTH = 600;
const MINIMUM_SIZE = 100;

export default function useResizableColumns(localStorageKey: string): {
  wrapperRef: {current: null | HTMLElement},
  resizeElementRef: {current: null | HTMLElement},
  onResizeStart: (event: SyntheticPointerEvent) => void,
  onResizeEnd: (event: SyntheticPointerEvent) => void,
  onResize: (event: SyntheticPointerEvent) => void,
} {
  const wrapperRef = useRef<null | HTMLElement>(null);
  const resizeElementRef = useRef<null | HTMLElement>(null);
  const isFirstRenderRef = useRef(true);

  const [state, dispatch] = useReducer<ResizeState, string, ResizeAction>(
    resizeReducer,
    localStorageKey,
    initResizeState,
  );

  const {horizontalPercentage, verticalPercentage} = state;

  // Set CSS variables once on mount from stored state.
  // After this, onResize updates them directly during drag.
  useLayoutEffect(() => {
    const resizeElement = resizeElementRef.current;

    setResizeCSSVariable(
      resizeElement,
      'horizontal',
      horizontalPercentage * 100,
    );
    setResizeCSSVariable(resizeElement, 'vertical', verticalPercentage * 100);
  }, []);

  // Skip the first run — initial state already came from localStorage.
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }

    const timeoutID = setTimeout(() => {
      localStorageSetItem(
        localStorageKey,
        JSON.stringify({
          horizontalPercentage,
          verticalPercentage,
        }),
      );
    }, 500);

    return () => clearTimeout(timeoutID);
  }, [localStorageKey, horizontalPercentage, verticalPercentage]);

  const onResizeStart = (event: SyntheticPointerEvent) => {
    const element = event.currentTarget;
    element.setPointerCapture(event.pointerId);
  };

  const onResizeEnd = (event: SyntheticPointerEvent) => {
    const element = event.currentTarget;
    element.releasePointerCapture(event.pointerId);
  };

  const onResize = (event: SyntheticPointerEvent) => {
    const element = event.currentTarget;
    const isResizing = element.hasPointerCapture(event.pointerId);
    if (!isResizing) {
      return;
    }

    const resizeElement = resizeElementRef.current;
    const wrapperElement = wrapperRef.current;

    if (wrapperElement === null || resizeElement === null) {
      return;
    }

    event.preventDefault();

    const orientation = getOrientation(wrapperElement);

    const {height, width, left, top} = wrapperElement.getBoundingClientRect();

    const currentMousePosition =
      orientation === 'horizontal' ? event.clientX - left : event.clientY - top;

    const boundaryMin = MINIMUM_SIZE;
    const boundaryMax =
      orientation === 'horizontal'
        ? width - MINIMUM_SIZE
        : height - MINIMUM_SIZE;

    const isMousePositionInBounds =
      currentMousePosition > boundaryMin && currentMousePosition < boundaryMax;

    if (isMousePositionInBounds) {
      const resizedElementDimension =
        orientation === 'horizontal' ? width : height;
      const actionType =
        orientation === 'horizontal'
          ? 'ACTION_SET_HORIZONTAL_PERCENTAGE'
          : 'ACTION_SET_VERTICAL_PERCENTAGE';
      const percentage = (currentMousePosition / resizedElementDimension) * 100;

      setResizeCSSVariable(resizeElement, orientation, percentage);

      dispatch({
        type: actionType,
        payload: currentMousePosition / resizedElementDimension,
      });
    }
  };

  return {
    wrapperRef,
    resizeElementRef,
    onResizeStart,
    onResizeEnd,
    onResize,
  };
}

function initResizeState(localStorageKey: string): ResizeState {
  let horizontalPercentage = 0.65;
  let verticalPercentage = 0.5;

  try {
    let data = localStorageGetItem(localStorageKey);
    if (data != null) {
      data = JSON.parse(data);
      if (typeof data.horizontalPercentage === 'number') {
        horizontalPercentage = Math.min(
          Math.max(data.horizontalPercentage, 0.1),
          0.9,
        );
      }
      if (typeof data.verticalPercentage === 'number') {
        verticalPercentage = Math.min(
          Math.max(data.verticalPercentage, 0.1),
          0.9,
        );
      }
    }
  } catch (error) {}

  return {
    horizontalPercentage,
    verticalPercentage,
  };
}

function resizeReducer(state: ResizeState, action: ResizeAction): ResizeState {
  switch (action.type) {
    case 'ACTION_SET_HORIZONTAL_PERCENTAGE':
      return {
        ...state,
        horizontalPercentage: action.payload,
      };
    case 'ACTION_SET_VERTICAL_PERCENTAGE':
      return {
        ...state,
        verticalPercentage: action.payload,
      };
    default:
      return state;
  }
}

function getOrientation(
  wrapperElement: null | HTMLElement,
): null | Orientation {
  if (wrapperElement != null) {
    const {width} = wrapperElement.getBoundingClientRect();
    return width > VERTICAL_MODE_MAX_WIDTH ? 'horizontal' : 'vertical';
  }
  return null;
}

function setResizeCSSVariable(
  resizeElement: null | HTMLElement,
  orientation: null | Orientation,
  percentage: number,
): void {
  if (resizeElement !== null && orientation !== null) {
    resizeElement.style.setProperty(
      `--${orientation}-resize-percentage`,
      `${percentage}%`,
    );
  }
}
