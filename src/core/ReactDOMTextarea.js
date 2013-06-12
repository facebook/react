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

var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactDOM = require('ReactDOM');

var invariant = require('invariant');

// Store a reference to the <textarea> `ReactNativeComponent`.
var textarea = ReactDOM.textarea;

// For quickly matching children type, to test if can be treated as content.
var CONTENT_TYPES = {'string': true, 'number': true};

var getTextContent = function(props) {
  return props.content != null ? '' + props.content :
    CONTENT_TYPES[typeof props.children] ? '' + props.children : '';
};

/**
 * Since setting .textContent on a dirty <textarea> doesn't update its value,
 * we intercept prop changes here to make sure that value is updated.
 */
var ReactDOMTextarea = ReactCompositeComponent.createClass({
  render: function() {
    invariant(
      this.props.dangerouslySetInnerHTML == null,
      '`dangerouslySetInnerHTML` does not make sense on textarea.'
    );
    invariant(
      this.props.children == null || CONTENT_TYPES[typeof this.props.children],
      'When present, textarea children must be a single string or number.'
    );
    return this.transferPropsTo(textarea(null, this.props.children));
  },

  componentDidUpdate: function(prevProps, prevState, rootNode) {
    var oldContent = getTextContent(prevProps);
    var newContent = getTextContent(this.props);
    if (oldContent !== newContent) {
      rootNode.value = newContent;
    }
  }
});

module.exports = ReactDOMTextarea;
