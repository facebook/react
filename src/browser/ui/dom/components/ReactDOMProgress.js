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
 * @providesModule ReactDOMProgress
 */

"use strict";

var LinkedValueUtils = require('LinkedValueUtils');
var ReactBrowserComponentMixin = require('ReactBrowserComponentMixin');
var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactDOM = require('ReactDOM');

// Store a reference to the <progress> `ReactDOMComponent`.
var progress = ReactDOM.progress;

/**
 * Implements <progress> native component that returns to an indeterminate
 * (barbershop-pole) state when its value prop is set to null or undefined.
 */
var ReactDOMProgress = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMProgress',

  mixins: [LinkedValueUtils.Mixin, ReactBrowserComponentMixin],

  componentDidUpdate: function(prevProps) {
    var previousValue;
    if(prevProps.valueLink) {
      previousValue = prevProps.valueLink.value;
    } else {
      previousValue = prevProps.value;
    }

    if(typeof previousValue === 'undefined' || previousValue === null) {
      return;
    }

    var value = LinkedValueUtils.getValue(this);
    if(typeof value === 'undefined' || value === null) {
      this.getDOMNode().removeAttribute('value');
    }
  },

  render: function() {
    return progress(this.props, this.props.children);
  }

});

module.exports = ReactDOMProgress;
