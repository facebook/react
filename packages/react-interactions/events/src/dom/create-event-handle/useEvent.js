/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import * as ReactDOM from 'react-dom';

const {useLayoutEffect, useRef} = React;
const {unstable_createEventHandle} = ReactDOM;

type UseEventHandle = {
  setListener: (
    target: EventTarget,
    null | ((SyntheticEvent<EventTarget>) => void),
  ) => void,
  clear: () => void,
};

export default function useEvent(
  event: string,
  options?: {
    capture?: boolean,
  },
): UseEventHandle {
  const handleRef = useRef<UseEventHandle | null>(null);
  let useEventHandle = handleRef.current;

  if (useEventHandle === null) {
    const setEventHandle = unstable_createEventHandle(event, options);
    const clears = new Map();
    useEventHandle = {
      setListener(
        target: EventTarget,
        callback: null | ((SyntheticEvent<EventTarget>) => void),
      ): void {
        let clear = clears.get(target);
        if (clear !== undefined) {
          clear();
        }
        if (callback === null) {
          clears.delete(target);
          return;
        }
        clear = setEventHandle(target, callback);
        clears.set(target, clear);
      },
      clear(): void {
        clears.forEach(c => {
          c();
        });
        clears.clear();
      },
    };
    handleRef.current = useEventHandle;
  }

  useLayoutEffect(() => {
    return () => {
      if (useEventHandle !== null) {
        useEventHandle.clear();
      }
      handleRef.current = null;
    };
  }, [useEventHandle]);

  return useEventHandle;
}
