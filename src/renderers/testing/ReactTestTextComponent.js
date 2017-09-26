/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactTestTextComponent
 * @flow
 */

'use strict';

import type {ReactText} from 'ReactTypes';

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
