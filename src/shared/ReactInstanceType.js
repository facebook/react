/**
 * Copyright (c) 2016-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactInstanceType
 * @flow
 */

'use strict';

// TODO: delete this file.
// It was only necessary for Stack.

import type {ReactElement} from 'ReactElementType';

export type DebugID = number;

export type ReactInstance = {
  mountComponent: any,
  unmountComponent: any,
  receiveComponent: any,
  getName: () => string,
  getPublicInstance: any,
  _currentElement: ReactElement,
};
