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
 * @providesModule ReactDOMTextarea
 */

"use strict";

var AutoFocusMixin = require('AutoFocusMixin');
var ReactBrowserComponentMixin = require('ReactBrowserComponentMixin');
var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactDescriptor = require('ReactDescriptor');
var ReactDOM = require('ReactDOM');

var invariant = require('invariant');
var merge = require('merge');

var warning = require('warning');

// Store a reference to the <textarea> `ReactDOMComponent`. TODO: use string
var textarea = ReactDescriptor.createFactory(ReactDOM.textarea.type);

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
  displayName: 'ReactDOMTextarea',

  mixins: [AutoFocusMixin, ReactBrowserComponentMixin],

  getInitialState: function() {
    return {
      // The initial value can be of any type, cast to string.
      initialValue: '' + this.props.initialValue
    };
  },

  componentWillMount: function() {
    if (__DEV__) {
      if (this.props.children != null) {
        warning(
          false,
          'Use the `defaultValue` property instead of setting children on ' +
          '<textarea>.'
        );
      }
    }
  },

  render: function() {
    // Clone `this.props` so we don't mutate the input.
    var props = merge(this.props);

    invariant(
      props.dangerouslySetInnerHTML == null,
      '`dangerouslySetInnerHTML` does not make sense on <textarea>.'
    );

    props.value = null;

    return textarea(props, this.state.initialValue);
  },

});

module.exports = ReactDOMTextarea;
