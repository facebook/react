/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMOption
 */

'use strict';

var ReactBrowserComponentMixin = require('ReactBrowserComponentMixin');
var ReactClass = require('ReactClass');
var ReactElement = require('ReactElement');

var warning = require('warning');

var option = ReactElement.createFactory('option');

/**
 * Implements an <option> native component that warns when `selected` is set.
 */
var ReactDOMOption = ReactClass.createClass({
  displayName: 'ReactDOMOption',
  tagName: 'OPTION',

  mixins: [ReactBrowserComponentMixin],

  componentWillMount: function() {
    // TODO (yungsters): Remove support for `selected` in <option>.
    if (__DEV__) {
      warning(
        this.props.selected == null,
        'Use the `defaultValue` or `value` props on <select> instead of ' +
        'setting `selected` on <option>.'
      );
    }
  },

  render: function() {
    return option(this.props, this.props.children);
  }

});

module.exports = ReactDOMOption;
