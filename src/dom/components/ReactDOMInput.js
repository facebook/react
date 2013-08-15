/**
 * Copyright 2013 Facebook, Inc.
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
 * @providesModule ReactDOMInput
 */

"use strict";

var DOMPropertyOperations = require('DOMPropertyOperations');
var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactDOM = require('ReactDOM');

var merge = require('merge');

// Store a reference to the <input> `ReactNativeComponent`.
var input = ReactDOM.input;

/**
 * Implements an <input> native component that allows setting these optional
 * props: `checked`, `value`, `defaultChecked`, and `defaultValue`.
 *
 * If `checked` or `value` are not supplied (or null/undefined), user actions
 * that affect the checked state or value will trigger updates to the element.
 *
 * If they are supplied (and not null/undefined), the rendered element will not
 * trigger updates to the element. Instead, the props must change in order for
 * the rendered element to be updated.
 *
 * The rendered element will be initialized as unchecked (or `defaultChecked`)
 * with an empty value (or `defaultValue`).
 *
 * @see http://www.w3.org/TR/2012/WD-html5-20121025/the-input-element.html
 */
var ReactDOMInput = ReactCompositeComponent.createClass({

  getInitialState: function() {
    return {
      checked: this.props.defaultChecked || false,
      value: this.props.defaultValue != null ? this.props.defaultValue : ''
    };
  },

  shouldComponentUpdate: function() {
    // Defer any updates to this component during the `onChange` handler.
    return !this._isChanging;
  },

  render: function() {
    // Clone `this.props` so we don't mutate the input.
    var props = merge(this.props);

    props.defaultChecked = null;
    props.defaultValue = null;
    props.checked =
      this.props.checked != null ? this.props.checked : this.state.checked;
    // Cast `this.props.value` to a string so equality checks pass.
    props.value =
      this.props.value != null ? '' + this.props.value : this.state.value;
    props.onChange = this._handleChange;

    return input(props, this.props.children);
  },

  componentDidUpdate: function(prevProps, prevState, rootNode) {
    if (this.props.checked != null) {
      DOMPropertyOperations.setValueForProperty(
        rootNode,
        'checked',
        this.props.checked || false
      );
    }
    if (this.props.value != null) {
      // Cast `this.props.value` to a string so falsey values that cast to
      // truthy strings are not ignored.
      DOMPropertyOperations.setValueForProperty(
        rootNode,
        'value',
        '' + this.props.value || ''
      );
    }
  },

  _handleChange: function(event) {
    var returnValue;
    if (this.props.onChange) {
      this._isChanging = true;
      returnValue = this.props.onChange(event);
      this._isChanging = false;
    }
    this.setState({
      checked: event.target.checked,
      value: event.target.value
    });
    return returnValue;
  }

});

module.exports = ReactDOMInput;
