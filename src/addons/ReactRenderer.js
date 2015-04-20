/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @typechecks
 * @providesModule ReactRenderer
 */

'use strict';

var React = require('React');
var ReactUpdateQueue = require('ReactUpdateQueue');

/**
 * Provided as a temporary helper to assist in upgrading legacy code
 * to a new version of React.
 * React.render() is the preferred solution.
 */
class ReactRenderer {
  constructor(nextElement, container, callback) {
    this.component = React.render(nextElement, container, callback);
  }

  setProps(partialProps, callback) {
    ReactUpdateQueue.enqueueSetProps(this.component, partialProps);
    if (callback) {
      ReactUpdateQueue.enqueueCallback(this.component, callback);
    }
  }
}

module.exports = ReactRenderer;
