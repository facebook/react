/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {useEffect, useState} from 'react';
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

  useEffect(() => {
    if (element != null) {
      const rect = element.getBoundingClientRect();
      safeStateUpdater(setSizeState, rect.width, rect.height);

      const resizeObserver = new ResizeObserver(entries => {
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

        // Flow doesn't know about new contentBoxSize property
        const entry = (entries[0]: any);
        if (entry.contentBoxSize) {
          // https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
          const contentBoxSize = Array.isArray(entry.contentBoxSize)
            ? entry.contentBoxSize[0]
            : entry.contentBoxSize;

          // https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserverEntry/contentBoxSize#value
          const writingMode = getComputedStyle(element)['writing-mode'];
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
          safeStateUpdater(setSizeState, contentRect.width, contentRect.height);
        }
      });

      resizeObserver.observe(element);
      return () => {
        resizeObserver.unobserve(element);
      };
    }
  }, [element]);

  return {ref: setRef, height: sizeState.height, width: sizeState.width};
}
