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
 * @providesModule ReactDOMInput
 */

"use strict";

var AutoFocusMixin = require('AutoFocusMixin');
var ReactBrowserComponentMixin = require('ReactBrowserComponentMixin');
var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactDescriptor = require('ReactDescriptor');
var ReactDOM = require('ReactDOM');

var merge = require('merge');

// Store a reference to the <input> `ReactDOMComponent`. TODO: use string
var input = ReactDescriptor.createFactory(ReactDOM.input.type);

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
  displayName: 'ReactDOMInput',

  mixins: [AutoFocusMixin, ReactBrowserComponentMixin],

  getInitialState: function() {
    return {
      initialChecked: this.props.initialChecked,
      initialValue: this.props.initialValue
    };
  },

  render: function() {
    // Clone `this.props` so we don't mutate the input.
    var props = merge(this.props);

    // should warn if this.props.children is set

    props.checked = this.state.initialChecked;

    var value = this.props.value;
    props.value = value != null ? value : this.state.initialValue;

    return input(props);
  },

});

module.exports = ReactDOMInput;
