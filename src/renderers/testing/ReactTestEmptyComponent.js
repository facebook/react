/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactTestEmptyComponent
 * @flow
 */

'use strict';

class ReactTestEmptyComponent {
  _currentElement: null;

  constructor() {
    this._currentElement = null;
  }
  receiveComponent(): void {}
  toJSON(): void {}
  mountComponent(): void {}
  getHostNode(): void {}
  unmountComponent(): void {}
}

module.exports = ReactTestEmptyComponent;
