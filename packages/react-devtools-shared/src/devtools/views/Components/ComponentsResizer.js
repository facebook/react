/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useEffect, useLayoutEffect, useReducer, useRef} from 'react';
import {
  localStorageGetItem,
  localStorageSetItem,
} from 'react-devtools-shared/src/storage';
import styles from './ComponentsResizer.css';

const LOCAL_STORAGE_KEY = 'React::DevTools::createResizeReducer';
const VERTICAL_MODE_MAX_WIDTH = 600;
const MINIMUM_SIZE = 50;

type Orientation = 'horizontal' | 'vertical';

type ResizeActionType =
  | 'ACTION_SET_DID_MOUNT'
  | 'ACTION_SET_IS_RESIZING'
  | 'ACTION_SET_HORIZONTAL_PERCENTAGE'
  | 'ACTION_SET_VERTICAL_PERCENTAGE';

type ResizeAction = {|
  type: ResizeActionType,
  payload: any,
|};

type ResizeState = {|
  horizontalPercentage: number,
  isResizing: boolean,
  verticalPercentage: number,
|};

function initResizeState(): ResizeState {
  let horizontalPercentage = 0.65;
  let verticalPercentage = 0.5;

  try {
    let data = localStorageGetItem(LOCAL_STORAGE_KEY);
    if (data != null) {
      data = JSON.parse(data);
      horizontalPercentage = data.horizontalPercentage;
      verticalPercentage = data.verticalPercentage;
    }
  } catch (error) {}

  return {
    horizontalPercentage,
    isResizing: false,
    verticalPercentage,
  };
}

function resizeReducer(state: ResizeState, action: ResizeAction): ResizeState {
  switch (action.type) {
    case 'ACTION_SET_IS_RESIZING':
      return {
        ...state,
        isResizing: action.payload,
      };
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

type Props = {|
  children: ({
    resizeElementRef: React$Ref<HTMLElement>,
    onResizeStart: () => void,
  }) => React$Node,
|};

export default function ComponentsResizer({children}: Props) {
  const wrapperElementRef = useRef<HTMLElement>(null);
  const resizeElementRef = useRef<HTMLElement>(null);

  const [state, dispatch] = useReducer<ResizeState, ResizeAction>(
    resizeReducer,
    null,
    initResizeState,
  );

  const {horizontalPercentage, verticalPercentage} = state;

  useLayoutEffect(() => {
    const resizeElement = resizeElementRef.current;

    setResizeCSSVariable(
      resizeElement,
      'horizontal',
      horizontalPercentage * 100,
    );
    setResizeCSSVariable(resizeElement, 'vertical', verticalPercentage * 100);
  }, []);

  useEffect(() => {
    const timeoutID = setTimeout(() => {
      localStorageSetItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          horizontalPercentage,
          verticalPercentage,
        }),
      );
    }, 500);

    return () => clearTimeout(timeoutID);
  }, [horizontalPercentage, verticalPercentage]);

  const {isResizing} = state;

  const onResizeStart = () =>
    dispatch({type: 'ACTION_SET_IS_RESIZING', payload: true});
  const onResizeEnd = () =>
    dispatch({type: 'ACTION_SET_IS_RESIZING', payload: false});

  const onResize = event => {
    const resizeElement = resizeElementRef.current;
    const wrapperElement = wrapperElementRef.current;

    if (!isResizing || wrapperElement === null || resizeElement === null) {
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

  return (
    <div
      ref={wrapperElementRef}
      className={styles.ComponentsWrapper}
      {...(isResizing && {
        onMouseMove: onResize,
        onMouseLeave: onResizeEnd,
        onMouseUp: onResizeEnd,
      })}>
      {children({resizeElementRef, onResizeStart})}
    </div>
  );
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
