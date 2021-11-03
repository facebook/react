/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {useEffect, useRef, useState} from 'react';
import ResizeObserver from 'resize-observer-polyfill';

type SizeState = {|
  height: number,
  width: number,
|};

type RefSetterFunction = (current: HTMLElement | null) => void;

function safeStateUpdater(setSizeState, width, height) {
  setSizeState(prevState => {
    if (prevState.height === height && prevState.width === width) {
      return prevState;
    } else {
      return {height, width};
    }
  });
}

export default function useResizeObserver(): {|
  ref: RefSetterFunction,
  height: number,
  width: number,
|} {
  const [sizeState, setSizeState] = useState<SizeState>({
    height: 0,
    width: 0,
  });

  const [element, setRef] = useState<HTMLElement | null>(null);

  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    elementRef.current = element;

    let resizeObserver = ((resizeObserverRef.current: any): ResizeObserver);
    if (resizeObserver === null) {
      resizeObserver = resizeObserverRef.current = new ResizeObserver(
        entries => {
          if (!Array.isArray(entries) || entries.length === 0) {
            return;
          }

          if (__DEV__) {
            if (entries.length > 1) {
              console.warn(
                'useResizeObserver() expects only one observed entry.',
              );
            }
          }

          const mostRecentElement = elementRef.current;
          if (mostRecentElement === null) {
            return;
          }

          // Flow doesn't know about new contentBoxSize property
          const entry = (entries[0]: any);
          if (entry.contentBoxSize) {
            // https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
            const contentBoxSize = Array.isArray(entry.contentBoxSize)
              ? entry.contentBoxSize[0]
              : entry.contentBoxSize;

            // https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry/contentBoxSize#value
            const writingMode = getComputedStyle(mostRecentElement)[
              'writing-mode'
            ];
            if (writingMode.startsWith('horizontal')) {
              safeStateUpdater(
                setSizeState,
                contentBoxSize.inlineSize,
                contentBoxSize.blockSize,
              );
            } else {
              safeStateUpdater(
                setSizeState,
                contentBoxSize.blockSize,
                contentBoxSize.inlineSize,
              );
            }
          } else {
            const contentRect = entry.contentRect;
            safeStateUpdater(
              setSizeState,
              contentRect.width,
              contentRect.height,
            );
          }
        },
      );
    }

    if (element != null) {
      const onMountRect = element.getBoundingClientRect();
      safeStateUpdater(setSizeState, onMountRect.width, onMountRect.height);

      let timeoutID = null;
      if (onMountRect.height === 0) {
        setTimeout(() => {
          timeoutID = null;

          const onTimeoutRect = element.getBoundingClientRect();
          safeStateUpdater(
            setSizeState,
            onTimeoutRect.width,
            onTimeoutRect.height,
          );
        });
      }

      // ResizeObserver doesn't fire in a Firefox extension when the DevTools panel is resized,
      // so we listen to the window for "resize" events as a backup.
      const onResize = event => {
        const onResizeRect = element.getBoundingClientRect();
        safeStateUpdater(setSizeState, onResizeRect.width, onResizeRect.height);
      };

      const targetWindow = element.ownerDocument.defaultView;
      targetWindow.addEventListener('resize', onResize);

      resizeObserver.observe(element);

      return () => {
        resizeObserver.unobserve(element);

        targetWindow.removeEventListener('resize', onResize);

        if (timeoutID !== null) {
          clearTimeout(timeoutID);
        }
      };
    }
  });

  return {ref: setRef, height: sizeState.height, width: sizeState.width};
}
