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
 * @providesModule ReactTransitionableChild
 */

"use strict";

var React = require('React');
var CSSCore = require('CSSCore');
var ReactTransitionEvents = require('ReactTransitionEvents');

// We don't remove the element from the DOM until we receive an animationend or
// transitionend event. If the user screws up and forgets to add an animation
// their node will be stuck in the DOM forever, so we detect if an animation
// does not start and if it doesn't, we just call the end listener immediately.
var TICK = 17;
var NO_EVENT_TIMEOUT = 5000;

var noEventListener = null;

if (__DEV__) {
  noEventListener = function() {
    console.warn(
      'transition(): tried to perform an animation without ' +
      'an animationend or transitionend event after timeout (' +
      NO_EVENT_TIMEOUT + 'ms). You should either disable this ' +
      'transition in JS or add a CSS animation/transition.'
    );
  };
}

/**
 * This component is simply responsible for watching when its single child
 * changes to undefined and animating the old child out. It does this by
 * recording its old child in savedChildren when it detects this event is about
 * to occur.
 */
var ReactTransitionableChild = React.createClass({
  /**
   * Perform an actual DOM transition. This takes care of a few things:
   * - Adding the second CSS class to trigger the transition
   * - Listening for the finish event
   * - Cleaning up the css (unless noReset is true)
   */
  transition: function(animationType, noReset, finishCallback) {
    var node = this.getDOMNode();
    var className = this.props.name + '-' + animationType;
    var activeClassName = className + '-active';
    var noEventTimeout = null;

    var endListener = function() {
      if (__DEV__) {
        clearTimeout(noEventTimeout);
      }

      // If this gets invoked after the component is unmounted it's OK.
      if (!noReset) {
        // Usually this means you're about to remove the node if you want to
        // leave it in its animated state.
        CSSCore.removeClass(node, className);
        CSSCore.removeClass(node, activeClassName);
      }

      ReactTransitionEvents.removeEndEventListener(node, endListener);

      // Usually this optional callback is used for informing an owner of
      // a leave animation and telling it to remove the child.
      finishCallback && finishCallback();
    };

    ReactTransitionEvents.addEndEventListener(node, endListener);

    CSSCore.addClass(node, className);

    // Need to do this to actually trigger a transition.
    this.queueClass(activeClassName);

    if (__DEV__) {
      noEventTimeout = setTimeout(noEventListener, NO_EVENT_TIMEOUT);
    }
  },

  queueClass: function(className) {
    this.classNameQueue.push(className);

    if (this.props.runNextTick) {
      this.props.runNextTick(this.flushClassNameQueue);
      return;
    }

    if (!this.timeout) {
      this.timeout = setTimeout(this.flushClassNameQueue, TICK);
    }
  },

  flushClassNameQueue: function() {
    if (this.isMounted()) {
      this.classNameQueue.forEach(
        CSSCore.addClass.bind(CSSCore, this.getDOMNode())
      );
    }
    this.classNameQueue.length = 0;
    this.timeout = null;
  },

  componentWillMount: function() {
    this.classNameQueue = [];
  },

  componentWillUnmount: function() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  },

  componentWillReceiveProps: function(nextProps) {
    if (!nextProps.children && this.props.children) {
      this.savedChildren = this.props.children;
    }
  },

  componentDidMount: function(node) {
    if (this.props.enter) {
      this.transition('enter');
    }
  },

  componentDidUpdate: function(prevProps, prevState, node) {
    if (prevProps.children && !this.props.children) {
      this.transition('leave', true, this.props.onDoneLeaving);
    }
  },

  render: function() {
    return this.props.children || this.savedChildren;
  }
});

module.exports = ReactTransitionableChild;
