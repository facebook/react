/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNodeTypes
 */

'use strict';

var ReactElement = require('ReactElement');

var invariant = require('invariant');

var ReactNodeTypes = {
  NATIVE: 0,
  COMPOSITE: 1,
  EMPTY: 2,

  getType: function(node) {
    if (node === null || node === false) {
      return ReactNodeTypes.EMPTY;
    } else if (ReactElement.isValidElement(node)) {
      if (typeof node.type === 'function') {
        return ReactNodeTypes.COMPOSITE;
      } else {
        return ReactNodeTypes.NATIVE;
      }
    }
    invariant(false, 'Unexpected node: %s', node);
  },
};

module.exports = ReactNodeTypes;
