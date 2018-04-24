/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {DOMTopLevelEventType} from 'react-dom/src/events/DOMTopLevelEventTypes';

export type TopLevelType =
  | DOMTopLevelEventType
  | 'topMouseDown'
  | 'topMouseMove'
  | 'topMouseUp'
  | 'topScroll'
  | 'topSelectionChange'
  | 'topTouchCancel'
  | 'topTouchEnd'
  | 'topTouchMove'
  | 'topTouchStart';
