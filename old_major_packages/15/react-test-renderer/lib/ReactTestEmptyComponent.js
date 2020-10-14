/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ReactTestEmptyComponent = function () {
  function ReactTestEmptyComponent() {
    _classCallCheck(this, ReactTestEmptyComponent);

    this._currentElement = null;
  }

  ReactTestEmptyComponent.prototype.receiveComponent = function receiveComponent() {};

  ReactTestEmptyComponent.prototype.toJSON = function toJSON() {};

  ReactTestEmptyComponent.prototype.mountComponent = function mountComponent() {};

  ReactTestEmptyComponent.prototype.getHostNode = function getHostNode() {};

  ReactTestEmptyComponent.prototype.unmountComponent = function unmountComponent() {};

  return ReactTestEmptyComponent;
}();

module.exports = ReactTestEmptyComponent;