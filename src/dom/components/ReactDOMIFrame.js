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
 * @providesModule ReactDOMIFrame
 */

"use strict";

var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactDOM = require('ReactDOM');
var ReactMount = require('ReactMount');

var AutoFocusMixin = require('AutoFocusMixin');

var invariant = require('invariant');

// Store a reference to the <iframe> `ReactDOMComponent`.
var iframe = ReactDOM.iframe;

var IMMOVABLE_NAME = 'data-reactimmovable';

function getReactRootNode(node) {
  return ReactMount.findReactContainerForID(ReactMount.getID(node));
}

function incrementImmovable(node) {
  var root = getReactRootNode(node);
  
  while (node !== root) {
    var countAfterUpdate = +node.getAttribute(IMMOVABLE_NAME) + 1;
    node.setAttribute(IMMOVABLE_NAME, countAfterUpdate);
    node = node.parentNode;
  }
}

function decrementImmovable(node) {
  var root = getReactRootNode(node);
  
  while (node !== root) {
    var countAfterUpdate = +node.getAttribute(IMMOVABLE_NAME) - 1;
    
    invariant(
      countAfterUpdate >= 0,
      'ReactDOMIFrame: expected to decrement `immovable` attribute, but ' +
      'the attribute does not exist on the node.'
    );
    
    if (countAfterUpdate) {
      node.setAttribute(IMMOVABLE_NAME, countAfterUpdate);
    } else {
      node.removeAttribute(IMMOVABLE_NAME);
    }
    
    node = node.parentNode;
  }
}

/**
 * Since <iframe> must never be detached from the DOM or it will reload, we mark
 * it as immovable. However, if one <iframe> would move to the other side of an
 * <iframe>, we have an impossible situation and one of them will reload.
 */
var ReactDOMIFrame = ReactCompositeComponent.createClass({
  displayName: 'ReactDOMIFrame',
  
  mixins: [AutoFocusMixin],

  render: function() {
    return iframe(this.props);
  },

  componentDidMount: function() {
    incrementImmovable(this.getDOMNode());
  },
  
  componentWillUnmount: function() {
    decrementImmovable(this.getDOMNode());
  }
});

module.exports = ReactDOMIFrame;
