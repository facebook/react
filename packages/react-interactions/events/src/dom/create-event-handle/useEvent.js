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

const {useEffect, useRef} = React;
const {unstable_createEventHandle: createEventHandle} = ReactDOM;

type UseEventHandle = {|
  setListener: (
    target: EventTarget,
    null | ((SyntheticEvent<EventTarget>) => void),
  ) => void,
  clear: () => void,
|};

export default function useEvent(
  event: string,
  options?: {|
    capture?: boolean,
    passive?: boolean,
    priority?: 0 | 1 | 2,
  |},
): UseEventHandle {
  const handleRef = useRef(null);

  if (handleRef.current == null) {
    handleRef.current = createEventHandle(event, options);
  }

  useEffect(() => {
    const handle = handleRef.current;
    return () => {
      if (handle !== null) {
        handle.clear();
      }
      handleRef.current = null;
    };
  }, []);

  return ((handleRef.current: any): UseEventHandle);
}
