/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import React, {
  Suspense,
  Fragment,
  useRef,
  useState,
  useLayoutEffect,
  useCallback,
} from 'react';
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

const LOCAL_STORAGE_RESIZE_ELEMENT_PERCENTAGE_HORIZONTAL_KEY = `React::DevTools::resizedElementPercentage::${RESIZE_DIRECTIONS.HORIZONTAL}`;
const LOCAL_STORAGE_RESIZE_ELEMENT_PERCENTAGE_VERTICAL_KEY = `React::DevTools::resizedElementPercentage::${RESIZE_DIRECTIONS.VERTICAL}`;

function ComponentResizer({children}): {|children: Function|} {
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [
    horizontalPercentage,
    setHorizontalPercentage,
  ] = useLocalStorage<number>(
    LOCAL_STORAGE_RESIZE_ELEMENT_PERCENTAGE_HORIZONTAL_KEY,
    65,
  );
  const [verticalPercentage, setVerticalPercentage] = useLocalStorage<number>(
    LOCAL_STORAGE_RESIZE_ELEMENT_PERCENTAGE_VERTICAL_KEY,
    50,
  );
  const updateLocalStorageTimeoutId = useRef<number>(null);
  const componentsWrapperRef = useRef<HTMLDivElement>(null);
  const resizeElementRef = useRef<HTMLElement>(null);
  const [resizeElementStyles, setResizeElementStyles] = useState<Object>({});
  const getResizeDirection: Function = useCallback(() => {
    if (componentsWrapperRef.current === null) {
      return RESIZE_DIRECTIONS.HORIZONTAL;
    }
    const VERTICAL_MODE_MAX_WIDTH: number = 600;
    const {width} = componentsWrapperRef.current.getBoundingClientRect();

    return width > VERTICAL_MODE_MAX_WIDTH
      ? RESIZE_DIRECTIONS.HORIZONTAL
      : RESIZE_DIRECTIONS.VERTICAL;
  }, [componentsWrapperRef]);

  const onResizeStart = useCallback(() => {
    setIsResizing(true);
  }, [setIsResizing]);

  const onResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, [setIsResizing]);

  const onResize = useCallback(
    e => {
      if (
        !isResizing ||
        componentsWrapperRef.current === null ||
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
      } = componentsWrapperRef.current.getBoundingClientRect();
      const resizeDirection = getResizeDirection();
      const currentMousePosition: number =
        resizeDirection === RESIZE_DIRECTIONS.HORIZONTAL
          ? e.clientX - left
          : e.clientY - top;
      const BOUNDARY_PADDING: number = 40;
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
        const updatedFlexBasisValue: number =
          (currentMousePosition / resizedElementDimension) * 100;

        resizeElementRef.current.style.flexBasis = `${updatedFlexBasisValue}%`;

        clearTimeout(updateLocalStorageTimeoutId.current);

        updateLocalStorageTimeoutId.current = setTimeout(() => {
          if (resizeDirection === RESIZE_DIRECTIONS.HORIZONTAL) {
            setHorizontalPercentage(updatedFlexBasisValue);
          } else {
            setVerticalPercentage(updatedFlexBasisValue);
          }
        }, 500);
      }
    },
    [componentsWrapperRef, resizeElementRef, isResizing],
  );

  useLayoutEffect(() => {
    if (componentsWrapperRef.current !== null) {
      if (getResizeDirection() === RESIZE_DIRECTIONS.HORIZONTAL) {
        setResizeElementStyles({
          flexBasis: `${horizontalPercentage}%`,
        });
      } else {
        setResizeElementStyles({
          flexBasis: `${verticalPercentage}%`,
        });
      }
    }
  }, [componentsWrapperRef, horizontalPercentage, verticalPercentage]);

  return (
    <div
      ref={componentsWrapperRef}
      className={styles.ComponentsWrapper}
      {...(isResizing && {
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
