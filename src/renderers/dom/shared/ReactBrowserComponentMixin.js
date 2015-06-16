/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactBrowserComponentMixin
 */

'use strict';

var ReactInstanceMap = require('ReactInstanceMap');

var findDOMNode = require('findDOMNode');
var warning = require('warning');

var didWarnKey = '_getDOMNodeDidWarn';

var ReactBrowserComponentMixin = {
  /**
   * Returns the DOM node rendered by this component.
   *
   * @return {DOMElement} The root node of this component.
   * @final
   * @protected
   */
  getDOMNode: function() {
    warning(
      this.constructor[didWarnKey],
      '%s.getDOMNode(...) is deprecated. Please use ' +
      'React.findDOMNode(instance) instead.',
      ReactInstanceMap.get(this).getName() || this.tagName || 'Unknown'
    );
    this.constructor[didWarnKey] = true;
    return findDOMNode(this);
  },
};

module.exports = ReactBrowserComponentMixin;
