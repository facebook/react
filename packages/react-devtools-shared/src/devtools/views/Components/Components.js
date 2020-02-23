/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Suspense, Fragment, useRef, useEffect, useReducer} from 'react';
import Tree from './Tree';
import SelectedElement from './SelectedElement';
import {InspectedElementContextController} from './InspectedElementContext';
import {NativeStyleContextController} from './NativeStyleEditor/context';
import {OwnersListContextController} from './OwnersListContext';
import portaledContent from '../portaledContent';
import {ModalDialog} from '../ModalDialog';
import SettingsModal from 'react-devtools-shared/src/devtools/views/Settings/SettingsModal';
import {SettingsModalContextController} from 'react-devtools-shared/src/devtools/views/Settings/SettingsModalContext';
import {useLocalStorage} from '../hooks';

import styles from './Components.css';

function Components(_: {||}) {
  return (
    <SettingsModalContextController>
      <OwnersListContextController>
        <InspectedElementContextController>
          <ComponentResizer>
            {({resizeElementRef, onResizeStart, resizeElementStyles}) => (
              <Fragment>
                <div
                  ref={resizeElementRef}
                  className={styles.TreeWrapper}
                  style={{
                    ...resizeElementStyles,
                  }}>
                  <Tree />
                </div>
                <div className={styles.ResizeBarWrapper}>
                  <div
                    onMouseDown={onResizeStart}
                    className={styles.ResizeBar}
                  />
                </div>
                <div className={styles.SelectedElementWrapper}>
                  <NativeStyleContextController>
                    <Suspense fallback={<Loading />}>
                      <SelectedElement />
                    </Suspense>
                  </NativeStyleContextController>
                </div>
                <ModalDialog />
                <SettingsModal />
              </Fragment>
            )}
          </ComponentResizer>
        </InspectedElementContextController>
      </OwnersListContextController>
    </SettingsModalContextController>
  );
}

type HorizontalResizeDirection = 'HORIZONTAL';
type VerticalResizeDirection = 'VERTICAL';

const RESIZE_DIRECTIONS: {|
  HORIZONTAL: HorizontalResizeDirection,
  VERTICAL: VerticalResizeDirection,
|} = {
  HORIZONTAL: 'HORIZONTAL',
  VERTICAL: 'VERTICAL',
};

function createResizeReducer(wrapperRef) {
  const LOCAL_STORAGE_RESIZE_ELEMENT_PERCENTAGE_HORIZONTAL_KEY = `React::DevTools::resizedElementPercentage::${RESIZE_DIRECTIONS.HORIZONTAL}`;
  const LOCAL_STORAGE_RESIZE_ELEMENT_PERCENTAGE_VERTICAL_KEY = `React::DevTools::resizedElementPercentage::${RESIZE_DIRECTIONS.VERTICAL}`;
  const [
    horizontalPercentage,
    setHorizontalPercentage,
  ] = useLocalStorage<string>(
    LOCAL_STORAGE_RESIZE_ELEMENT_PERCENTAGE_HORIZONTAL_KEY,
    '65%',
  );
  const [verticalPercentage, setVerticalPercentage] = useLocalStorage<string>(
    LOCAL_STORAGE_RESIZE_ELEMENT_PERCENTAGE_VERTICAL_KEY,
    '50%',
  );
  const resizeTimeout = useRef(null);

  const getResizeDirection: Function = ref => () => {
    if (ref.current != null) {
      const VERTICAL_MODE_MAX_WIDTH: number = 600;
      const {width} = ref.current.getBoundingClientRect();

      return width > VERTICAL_MODE_MAX_WIDTH
        ? RESIZE_DIRECTIONS.HORIZONTAL
        : RESIZE_DIRECTIONS.VERTICAL;
    }

    return RESIZE_DIRECTIONS.HORIZONTAL;
  };

  // We need to watch/set for changes to this ref in order to get the correct resize direction.
  useEffect(() => {
    if (wrapperRef.current != null) {
      dispatch({type: 'setWrapperRef', payload: wrapperRef});
    }
  }, [wrapperRef]);

  const initialState = {
    wrapperRef: wrapperRef,
    isResizing: false,
    horizontalPercentage,
    verticalPercentage,
    getResizeDirection: getResizeDirection(wrapperRef),
  };

  const ACTION_TYPES = {
    SET_IS_RESIZING: 'setIsResizing',
    SET_WRAPPER_REF: 'setWrapperRef',
    SET_HORIZONTAL_PERCENTAGE: 'setHorizontalPercentage',
    SET_VERTICAL_PERCENTAGE: 'setVerticalPercentage',
  };

  // eslint-disable-next-line no-shadow
  const [state, dispatch] = useReducer((state, action) => {
    switch (action.type) {
      case ACTION_TYPES.SET_IS_RESIZING:
        return {
          ...state,
          isResizing: action.payload,
        };
      case ACTION_TYPES.SET_WRAPPER_REF:
        return {
          ...state,
          wrapperRef: action.payload,
          getResizeDirection: getResizeDirection(action.payload),
        };
      case ACTION_TYPES.SET_HORIZONTAL_PERCENTAGE:
      case ACTION_TYPES.SET_VERTICAL_PERCENTAGE:
        const percentageState = {
          [action.type === ACTION_TYPES.SET_HORIZONTAL_PERCENTAGE
            ? 'horizontalPercentage'
            : 'verticalPercentage']: action.payload,
        };

        clearTimeout(resizeTimeout.current);
        resizeTimeout.current = setTimeout(() => {
          if (action.type === ACTION_TYPES.SET_HORIZONTAL_PERCENTAGE) {
            setHorizontalPercentage(action.payload);
          } else {
            setVerticalPercentage(action.payload);
          }
        }, 400);

        return {
          ...state,
          ...percentageState,
        };
      default:
        return state;
    }
  }, initialState);

  return [state, dispatch, ACTION_TYPES];
}

function ComponentResizer({children}): {|children: Function|} {
  const componentsWrapperRef = useRef<HTMLDivElement>(null);
  const resizeElementRef = useRef<HTMLElement>(null);
  const [state, dispatch, ACTION_TYPES] = createResizeReducer(
    componentsWrapperRef,
  );

  const onResizeStart = () =>
    dispatch({type: ACTION_TYPES.SET_IS_RESIZING, payload: true});
  const onResizeEnd = () =>
    dispatch({type: ACTION_TYPES.SET_IS_RESIZING, payload: false});
  const onResize = e => {
    if (
      !state.isResizing ||
      state.wrapperRef.current === null ||
      resizeElementRef.current === null
    ) {
      return;
    }

    e.preventDefault();

    const {
      height,
      width,
      left,
      top,
    } = state.wrapperRef.current.getBoundingClientRect();
    const resizeDirection = state.getResizeDirection();

    const currentMousePosition: number =
      resizeDirection === RESIZE_DIRECTIONS.HORIZONTAL
        ? e.clientX - left
        : e.clientY - top;
    const BOUNDARY_PADDING: number = 42;
    const boundary: {|
      min: number,
      max: number,
    |} = {
      min: BOUNDARY_PADDING,
      max:
        resizeDirection === RESIZE_DIRECTIONS.HORIZONTAL
          ? width - BOUNDARY_PADDING
          : height - BOUNDARY_PADDING,
    };
    const isMousePositionInBounds: boolean =
      currentMousePosition > boundary.min &&
      currentMousePosition < boundary.max;

    if (isMousePositionInBounds) {
      const resizedElementDimension: number =
        resizeDirection === RESIZE_DIRECTIONS.HORIZONTAL ? width : height;
      const updatedFlexBasisValue: string = `${(currentMousePosition /
        resizedElementDimension) *
        100}%`;
      const SET_PERCENTAGE_ACTION =
        resizeDirection === RESIZE_DIRECTIONS.HORIZONTAL
          ? ACTION_TYPES.SET_HORIZONTAL_PERCENTAGE
          : ACTION_TYPES.SET_VERTICAL_PERCENTAGE;

      resizeElementRef.current.style.flexBasis = updatedFlexBasisValue;
      dispatch({type: SET_PERCENTAGE_ACTION, payload: updatedFlexBasisValue});
    }
  };

  const resizeElementStyles = {
    flexBasis:
      state.getResizeDirection() === RESIZE_DIRECTIONS.HORIZONTAL
        ? state.horizontalPercentage
        : state.verticalPercentage,
  };

  return (
    <div
      ref={componentsWrapperRef}
      className={styles.ComponentsWrapper}
      {...(state.isResizing && {
        onMouseMove: onResize,
        onMouseLeave: onResizeEnd,
        onMouseUp: onResizeEnd,
      })}>
      {children({resizeElementRef, onResizeStart, resizeElementStyles})}
    </div>
  );
}

function Loading() {
  return <div className={styles.Loading}>Loading...</div>;
}

export default portaledContent(Components);
