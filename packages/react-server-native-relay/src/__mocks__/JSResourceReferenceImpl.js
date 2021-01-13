/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

class JSResourceReferenceImpl {
  constructor(exportedValue) {
    this._moduleId = exportedValue;
  }
  getModuleId() {
    return this._moduleId;
  }
}

module.exports = JSResourceReferenceImpl;
