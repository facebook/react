/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactElementTestChild
 */

'use strict';

var React = require('React');

var Child = React.createClass({
  render: function() {
    return React.createElement('div');
  },
});

module.exports = Child;
