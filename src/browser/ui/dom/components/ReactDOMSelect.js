/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @providesModule ReactDOMSelect
 */

"use strict";

var AutoFocusMixin = require('AutoFocusMixin');
var ReactBrowserComponentMixin = require('ReactBrowserComponentMixin');
var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactDescriptor = require('ReactDescriptor');
var ReactDOM = require('ReactDOM');

// Store a reference to the <select> `ReactDOMComponent`. TODO: use string
var select = ReactDescriptor.createFactory(ReactDOM.select.type);

/**
 * Validation function for `value` and `defaultValue`.
 * @private
 */
function selectValueType(props, propName, componentName) {
  if (props[propName] == null) {
    return;
  }
  if (props.multiple) {
    if (!Array.isArray(props[propName])) {
      return new Error(
        `The \`${propName}\` prop supplied to <select> must be an array if ` +
        `\`multiple\` is true.`
      );
    }
  } else {
    if (Array.isArray(props[propName])) {
      return new Error(
        `The \`${propName}\` prop supplied to <select> must be a scalar ` +
        `value if \`multiple\` is false.`
      );
    }
  }
}

/**
 * Implements a <select> native component that allows optionally setting the
 * props `value` and `defaultValue`. If `multiple` is false, the prop must be a
 * string. If `multiple` is true, the prop must be an array of strings.
 *
 * If `value` is not supplied (or null/undefined), user actions that change the
 * selected option will trigger updates to the rendered options.
 *
 * If it is supplied (and not null/undefined), the rendered options will not
 * update in response to user actions. Instead, the `value` prop must change in
 * order for the rendered options to update.
 *
 * If `defaultValue` is provided, any options with the supplied values will be
 * selected.
 */
var ReactDOMSelect = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMSelect',

  mixins: [AutoFocusMixin, ReactBrowserComponentMixin],

  propTypes: {
    initialValue: selectValueType,
  },

  getInitialState: function() {
    return {
      initialValue: this.props.initialValue
    };
  },

  componentDidMount: function() {
    var value = this.state.initialValue;
    if (value != null) {
      var multiple = this.props.multiple;
      var options = this.getDOMNode().options;
      var selectedValue, i, l;
      if (multiple) {
        selectedValue = {};
        for (i = 0, l = value.length; i < l; ++i) {
          selectedValue['' + value[i]] = true;
        }
      } else {
        selectedValue = '' + value;
      }
      for (i = 0, l = options.length; i < l; i++) {
        var selected = multiple ?
          selectedValue.hasOwnProperty(options[i].value) :
          options[i].value === selectedValue;

        if (selected) {
          options[i].selected = true;
        }
      }
    }
  },

  render: function() {
    return select(this.props, this.props.children);
  },

});

module.exports = ReactDOMSelect;
