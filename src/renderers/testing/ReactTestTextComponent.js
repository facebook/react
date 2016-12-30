/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactTestTextComponent
 * @preventMunge
 * @flow
 */

'use strict';

import type { ReactText } from 'ReactTypes';

class ReactTestTextComponent {
  _currentElement: ReactText;

  constructor(element: ReactText) {
    this._currentElement = element;
  }

  receiveComponent(nextElement: ReactText) {
    this._currentElement = nextElement;
  }

  toJSON(): ReactText {
    return this._currentElement;
  }

  mountComponent(): void {}
  getHostNode(): void {}
  unmountComponent(): void {}
}

module.exports = ReactTestTextComponent;
