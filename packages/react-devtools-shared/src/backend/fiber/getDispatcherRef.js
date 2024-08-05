/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  CurrentDispatcherRef,
  ReactRenderer,
} from 'react-devtools-shared/src/backend/types';

// Do not add / import anything to this file.
// This function is used from multiple places, including hook.

export default function getDispatcherRef(
  renderer: ReactRenderer,
): void | CurrentDispatcherRef {
  if (renderer.currentDispatcherRef === undefined) {
    return undefined;
  }
  const injectedRef = renderer.currentDispatcherRef;
  if (
    typeof injectedRef.H === 'undefined' &&
    typeof injectedRef.current !== 'undefined'
  ) {
    // We got a legacy dispatcher injected, let's create a wrapper proxy to translate.
    return {
      get H() {
        return (injectedRef: any).current;
      },
      set H(value) {
        (injectedRef: any).current = value;
      },
    };
  }
  return (injectedRef: any);
}
