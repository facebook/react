/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactTestEmptyComponent
 * @preventMunge
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
