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
var ReactChildren = require('ReactChildren');
var ReactClass = require('ReactClass');
var ReactDOMSelect = require('ReactDOMSelect');
var ReactElement = require('ReactElement');
var ReactPropTypes = require('ReactPropTypes');

var assign = require('Object.assign');
var warning = require('warning');

var option = ReactElement.createFactory('option');

var valueContextKey = ReactDOMSelect.valueContextKey;

/**
 * Implements an <option> native component that warns when `selected` is set.
 */
var ReactDOMOption = ReactClass.createClass({
  displayName: 'ReactDOMOption',
  tagName: 'OPTION',

  mixins: [ReactBrowserComponentMixin],

  getInitialState: function() {
    return {selected: null};
  },

  contextTypes: (function() {
    var obj = {};
    obj[valueContextKey] = ReactPropTypes.any;
    return obj;
  })(),

  componentWillMount: function() {
    // TODO (yungsters): Remove support for `selected` in <option>.
    if (__DEV__) {
      warning(
        this.props.selected == null,
        'Use the `defaultValue` or `value` props on <select> instead of ' +
        'setting `selected` on <option>.'
      );
    }

    // Look up whether this option is 'selected' via parent-based context
    var context = this.context;
    var selectValue = context[valueContextKey];

    // If context key is null (e.g., no specified value or after initial mount)
    // or missing (e.g., for <datalist>) skip props
    if (selectValue != null) {
      var selected = false;
      if (Array.isArray(selectValue)) {
        // multiple
        for (var i = 0; i < selectValue.length; i++) {
          if ('' + selectValue[i] === '' + this.props.value) {
            selected = true;
            break;
          }
        }
      } else {
        selected = ('' + selectValue === '' + this.props.value);
      }
      this.setState({selected: selected});
    }
  },

  render: function() {
    var props = this.props;

    // Read state only from initial mount because <select> updates value
    // manually; we need the initial state only for server rendering
    if (this.state.selected != null) {
      props = assign({}, props, {selected: this.state.selected});
    }

    var content = '';

    // Flatten children and warn if they aren't strings or numbers;
    // invalid types are ignored.
    ReactChildren.forEach(this.props.children, function(child) {
      if (child == null) {
        return;
      }
      if (typeof child === 'string' || typeof child === 'number') {
        content += child;
      } else {
        warning(
          false,
          'Only strings and numbers are supported as <option> children.'
        );
      }
    });

    return option(props, content);
  },

});

module.exports = ReactDOMOption;
