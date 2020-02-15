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
  useMemo,
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

const resizeDirections = {
  HORIZONTAL: 'HORIZONTAL',
  VERTICAL: 'VERTICAL',
};

function ComponentResizer({children}): {|children: Function|} {
  const [isResizing, setIsResizing] = useState(false);
  const [
    horizontalPercentage,
    setHorizontalPercentage,
  ] = useLocalStorage<number>(
    `React::DevTools::resizedElementPercentage::${resizeDirections.HORIZONTAL}`,
    65,
  );
  const [verticalPercentage, setVerticalPercentage] = useLocalStorage<number>(
    `React::DevTools::resizedElementPercentage::${resizeDirections.VERTICAL}`,
    50,
  );
  const updateLocalStorageTimeoutId = useRef(null);
  const componentsWrapperRef = useRef(null);
  const resizeElementRef = useRef(null);

  // TODO: We might be saving the localStorage values,
  // TODO: but window.innerWidth might be bellow 600 so that why it's broken.
  // TODO: OR we can't access the property when building the extension. :(
  const resizeElementStyles = useMemo(
    () => ({
      flexBasis: `${
        window.innerWidth > 600 ? horizontalPercentage : verticalPercentage
      }%`,
    }),
    [horizontalPercentage, verticalPercentage],
  );

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
      const resizeDirection =
        width > 600 ? resizeDirections.HORIZONTAL : resizeDirections.VERTICAL;
      const currentMousePosition =
        resizeDirection === resizeDirections.HORIZONTAL
          ? e.clientX - left
          : e.clientY - top;
      const boundary = {
        min: 40,
        max:
          resizeDirection === resizeDirections.HORIZONTAL
            ? width - 40
            : height - 40,
      };
      const mousePositionInBounds =
        currentMousePosition > boundary.min &&
        currentMousePosition < boundary.max;

      if (mousePositionInBounds) {
        const updatedFlexBasisValue =
          (currentMousePosition /
            (resizeDirection === resizeDirections.HORIZONTAL
              ? width
              : height)) *
          100;

        resizeElementRef.current.style.flexBasis = `${updatedFlexBasisValue}%`;

        clearTimeout(updateLocalStorageTimeoutId.current);

        updateLocalStorageTimeoutId.current = setTimeout(() => {
          if (resizeDirection === resizeDirections.HORIZONTAL) {
            setHorizontalPercentage(updatedFlexBasisValue);
          } else {
            setVerticalPercentage(updatedFlexBasisValue);
          }
        }, 500);
      }
    },
    [componentsWrapperRef, resizeElementRef, isResizing],
  );

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
