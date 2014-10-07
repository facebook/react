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
 * @providesModule ReactTextarea
 */

"use strict";

var DOMPropertyOperations = require('DOMPropertyOperations');
var LinkedValueUtils = require('LinkedValueUtils');
var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactDescriptor = require('ReactDescriptor');
var ReactDOMTextarea = require('ReactDOMTextarea');
var ReactUpdates = require('ReactUpdates');

var merge = require('merge');

// Store a reference to the <textarea> `ReactDOMComponent`. TODO: use string
var textarea = ReactDescriptor.createFactory(ReactDOMTextarea.type);

function forceUpdateIfMounted() {
  /*jshint validthis:true */
  if (this.isMounted()) {
    this.forceUpdate();
  }
}

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
var ReactTextarea = ReactCompositeComponent.createClass({
  displayName: 'ReactTextarea',

  mixins: [LinkedValueUtils.Mixin],

  getInitialState: function() {
    var value = LinkedValueUtils.getValue(this);
    return {
      // We don't have to save the initial value, but do it to play nice if
      // `ReactDOMTextarea` decides to use `shouldComponentUpdate`.
      initialValue: value != null ? value : this.props.defaultValue
    };
  },

  render: function() {
    // Clone `this.props` so we don't mutate the input.
    var props = merge(this.props);

    props.initialValue = this.state.initialValue;
    props.onChange = this._handleChange;

    return textarea(props, props.children);
  },

  componentDidUpdate: function(prevProps, prevState, prevContext) {
    var value = LinkedValueUtils.getValue(this);
    if (value != null) {
      DOMPropertyOperations.setValueForProperty(
        this.getDOMNode(),
        'value',
        value
      );
    }
  },

  _handleChange: function(event) {
    var returnValue;
    var onChange = LinkedValueUtils.getOnChange(this);
    if (onChange) {
      returnValue = onChange.call(this, event);
    }
    ReactUpdates.setImmediate(forceUpdateIfMounted, this);
    return returnValue;
  }

});

module.exports = ReactTextarea;
