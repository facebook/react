/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {
  FlamechartStackFrame,
  InternalModuleSourceToRanges,
} from '../../types';

import {
  CHROME_WEBSTORE_EXTENSION_ID,
  INTERNAL_EXTENSION_ID,
  LOCAL_EXTENSION_ID,
} from 'react-devtools-shared/src/constants';

export function isInternalModule(
  internalModuleSourceToRanges: InternalModuleSourceToRanges,
  flamechartStackFrame: FlamechartStackFrame,
): boolean {
  const {locationColumn, locationLine, scriptUrl} = flamechartStackFrame;

  if (scriptUrl == null || locationColumn == null || locationLine == null) {
    // This could indicate a browser-internal API like performance.mark().
    return false;
  }

  // Internal modules are only registered if DevTools was running when the profile was captured,
  // but DevTools should also hide its own frames to avoid over-emphasizing them.
  if (
    // Handle webpack-internal:// sources
    scriptUrl.includes('/react-devtools') ||
    scriptUrl.includes('/react_devtools') ||
    // Filter out known extension IDs
    scriptUrl.includes(CHROME_WEBSTORE_EXTENSION_ID) ||
    scriptUrl.includes(INTERNAL_EXTENSION_ID) ||
    scriptUrl.includes(LOCAL_EXTENSION_ID)
    // Unfortunately this won't get everything, like relatively loaded chunks or Web Worker files.
  ) {
    return true;
  }

  // Filter out React internal packages.
  const ranges = internalModuleSourceToRanges.get(scriptUrl);
  if (ranges != null) {
    for (let i = 0; i < ranges.length; i++) {
      const [startStackFrame, stopStackFrame] = ranges[i];

      const isAfterStart =
        locationLine > startStackFrame.lineNumber ||
        (locationLine === startStackFrame.lineNumber &&
          locationColumn >= startStackFrame.columnNumber);
      const isBeforeStop =
        locationLine < stopStackFrame.lineNumber ||
        (locationLine === stopStackFrame.lineNumber &&
          locationColumn <= stopStackFrame.columnNumber);

      if (isAfterStart && isBeforeStop) {
        return true;
      }
    }
  }

  return false;
}
