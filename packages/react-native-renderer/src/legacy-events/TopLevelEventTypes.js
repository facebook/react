/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

export type RNTopLevelEventType =
  | 'topMouseDown'
  | 'topMouseMove'
  | 'topMouseUp'
  | 'topScroll'
  | 'topSelectionChange'
  | 'topTouchCancel'
  | 'topTouchEnd'
  | 'topTouchMove'
  | 'topTouchStart';

export opaque type DOMTopLevelEventType = string;

// Do not use the below two methods directly!
// Instead use constants exported from DOMTopLevelEventTypes in ReactDOM.
// (It is the only module that is allowed to access these methods.)

export function unsafeCastStringToDOMTopLevelType(
  topLevelType: string,
): DOMTopLevelEventType {
  return topLevelType;
}

export function unsafeCastDOMTopLevelTypeToString(
  topLevelType: DOMTopLevelEventType,
): string {
  return topLevelType;
}

export type TopLevelType = DOMTopLevelEventType | RNTopLevelEventType;
