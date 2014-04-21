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
var LinkedValueUtils = require('LinkedValueUtils');
var ReactBrowserComponentMixin = require('ReactBrowserComponentMixin');
var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactDOM = require('ReactDOM');

var merge = require('merge');

// Store a reference to the <select> `ReactDOMComponent`.
var select = ReactDOM.select;

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

  mixins: [AutoFocusMixin, LinkedValueUtils.Mixin, ReactBrowserComponentMixin],

  propTypes: {
    defaultValue: selectValueType,
    value: selectValueType
  },

  getInitialState: function() {
    return {value: this.props.defaultValue || (this.props.multiple ? [] : '')};
  },

  componentWillReceiveProps: function(nextProps) {
    if (!this.props.multiple && nextProps.multiple) {
      this.setState({value: [this.state.value]});
    } else if (this.props.multiple && !nextProps.multiple) {
      this.setState({value: this.state.value[0]});
    }
  },

  shouldComponentUpdate: function() {
    // Defer any updates to this component during the `onChange` handler.
    return !this._isChanging;
  },

  render: function() {
    // Clone `this.props` so we don't mutate the input.
    var props = merge(this.props);

    props.onChange = this._handleChange;
    props.value = null;

    // Sets selected on the appropriate child option descriptors
    var propValue = LinkedValueUtils.getValue(this);
    var value = propValue != null ? propValue : this.state.value;
    var selectedValue, i, l;
    if (this.props.multiple) {
      selectedValue = {};
      for (i = 0, l = value.length; i < l; ++i) {
        selectedValue['' + value[i]] = true;
      }
    } else {
      selectedValue = '' + value;
    }
    for (i = 0, l = this.props.children.length; i < l; i++) {
      var optionDescriptor = this.props.children[i];
      if (!optionDescriptor) continue;
      var selected = this.props.multiple ?
        selectedValue.hasOwnProperty(optionDescriptor.props.value) :
        optionDescriptor.props.value === selectedValue;

      if (selected !== optionDescriptor.props.selected) {
        optionDescriptor.props.selected = selected;
      }
    }

    return select(props, this.props.children);
  },

  _handleChange: function(event) {
    var returnValue;
    var onChange = LinkedValueUtils.getOnChange(this);
    if (onChange) {
      this._isChanging = true;
      returnValue = onChange.call(this, event);
      this._isChanging = false;
    }

    var selectedValue;
    if (this.props.multiple) {
      selectedValue = [];
      var options = event.target.options;
      for (var i = 0, l = options.length; i < l; i++) {
        if (options[i].selected) {
          selectedValue.push(options[i].value);
        }
      }
    } else {
      selectedValue = event.target.value;
    }

    this.setState({value: selectedValue});
    return returnValue;
  }

});

module.exports = ReactDOMSelect;
