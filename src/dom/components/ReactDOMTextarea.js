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
 * @providesModule ReactDOMTextarea
 */

"use strict";

var DOMPropertyOperations = require('DOMPropertyOperations');
var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactDOM = require('ReactDOM');

var invariant = require('invariant');
var merge = require('merge');

// Store a reference to the <textarea> `ReactNativeComponent`.
var textarea = ReactDOM.textarea;

// For quickly matching children type, to test if can be treated as content.
var CONTENT_TYPES = {'string': true, 'number': true};

/**
 * Implements a <textarea> native component that allows setting `value`, and
 * `defaultValue`. This differs from the traditional DOM API because value is
 * usually set as PCDATA children.
 *
 * If `value` is not supplied (or null/undefined), user actions that affect the
 * value will trigger updates to the element.
 *
 * If `value` is supplied (and not null/undefined), the rendered element will
 * not trigger updates to the element. Instead, the `value` prop must change in
 * order for the rendered element to be updated.
 *
 * The rendered element will be initialized with an empty value, the prop
 * `defaultValue` if specified, or the children content (deprecated).
 */
var ReactDOMTextarea = ReactCompositeComponent.createClass({

  getInitialState: function() {
    var defaultValue = this.props.defaultValue;
    // TODO (yungsters): Remove support for children content in <textarea>.
    var children = this.props.children;
    if (children != null) {
      if (__DEV__) {
        console.warn(
          'Use the `defaultValue` or `value` props instead of setting ' +
          'children on <textarea>.'
        );
      }
      invariant(
        defaultValue == null,
        'If you supply `defaultValue` on a <textarea>, do not pass children.'
      );
      if (Array.isArray(children)) {
        invariant(
          children.length <= 1,
          '<textarea> can only have at most one child.'
        );
        children = children[0];
      }
      invariant(
        CONTENT_TYPES[typeof children],
        'If you specify children to <textarea>, it must be a single string ' +
        'or number., not an array or object.'
      );
      defaultValue = '' + children;
    }
    if (defaultValue == null) {
      defaultValue = '';
    }
    return {
      // We save the initial value so that `ReactNativeComponent` doesn't update
      // `textContent` (unnecessary since we update value).
      initialValue: this.props.value != null ? this.props.value : defaultValue,
      value: defaultValue
    };
  },

  shouldComponentUpdate: function() {
    // Defer any updates to this component during the `onChange` handler.
    return !this._isChanging;
  },

  render: function() {
    // Clone `this.props` so we don't mutate the input.
    var props = merge(this.props);

    invariant(
      props.dangerouslySetInnerHTML == null,
      '`dangerouslySetInnerHTML` does not make sense on <textarea>.'
    );

    props.defaultValue = null;
    props.value =
      this.props.value != null ? this.props.value : this.state.value;
    props.onChange = this._handleChange;

    // Always set children to the same thing. In IE9, the selection range will
    // get reset if `textContent` is mutated.
    return textarea(props, this.state.initialValue);
  },

  componentDidUpdate: function(prevProps, prevState, rootNode) {
    if (this.props.value != null) {
      DOMPropertyOperations.setValueForProperty(
        rootNode,
        'value',
        this.props.value || ''
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
    this.setState({value: event.target.value});
    return returnValue;
  }

});

module.exports = ReactDOMTextarea;
