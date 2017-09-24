/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactNodeTypes
 * @flow
 */

'use strict';

type ReactNodeType = 0 | 1 | 2;

var React = require('react');

var invariant = require('fbjs/lib/invariant');

var ReactNodeTypes = {
  HOST: 0,
  COMPOSITE: 1,
  EMPTY: 2,

  getType: function(node: React$Element<any>): ReactNodeType {
    if (node === null || node === false) {
      return ReactNodeTypes.EMPTY;
    } else if (React.isValidElement(node)) {
      if (typeof node.type === 'function') {
        return ReactNodeTypes.COMPOSITE;
      } else {
        return ReactNodeTypes.HOST;
      }
    }
    invariant(false, 'Unexpected node: %s', node);
  },
};

module.exports = ReactNodeTypes;
