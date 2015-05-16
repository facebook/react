/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMButton
 */

'use strict';

var AutoFocusMixin = require('AutoFocusMixin');
var ReactBrowserComponentMixin = require('ReactBrowserComponentMixin');
var ReactClass = require('ReactClass');
var ReactElement = require('ReactElement');

var filterDisabledEvents = require('filterDisabledEvents');

var button = ReactElement.createFactory('button');

/**
 * Implements a <button> native component that does not receive mouse events
 * when `disabled` is set.
 */
var ReactDOMButton = ReactClass.createClass({
  displayName: 'ReactDOMButton',
  tagName: 'BUTTON',

  mixins: [AutoFocusMixin, ReactBrowserComponentMixin],

  render: function() {
    var props = filterDisabledEvents(this.props);

    return button(props, this.props.children);
  }

});

module.exports = ReactDOMButton;
