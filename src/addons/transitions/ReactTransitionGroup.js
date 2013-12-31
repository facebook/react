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
 * @providesModule ReactTransitionGroup
 */

"use strict";

var React = require('React');
var ReactTransitionableChild = require('ReactTransitionableChild');
var ReactTransitionKeySet = require('ReactTransitionKeySet');

var ReactTransitionGroup = React.createClass({

  propTypes: {
    transitionName: React.PropTypes.string.isRequired,
    transitionEnter: React.PropTypes.bool,
    transitionLeave: React.PropTypes.bool,
    transitionStaggering: React.PropTypes.bool,
    transitionStaggeringDirectional: React.PropTypes.bool,
    onTransition: React.PropTypes.func,
    component: React.PropTypes.func
  },

  getDefaultProps: function() {
    return {
      transitionEnter: true,
      transitionLeave: true,
      transitionStaggering: false,
      transitionStaggeringDirectional: false,
      component: React.DOM.span
    };
  },

  componentWillMount: function() {
    // _transitionGroupCurrentKeys stores the union of previous *and* next keys.
    // If this were a component we'd store it as state, however, since this must
    // be a mixin, we need to keep the result of the union of keys in each
    // call to animateChildren() which happens in render(), so we can't
    // call setState() in there.
    this._transitionGroupCurrentKeys = {};
    this._transitionGroupLastVisibleOrder = [];
  },

  componentDidUpdate: function() {
    if (this.props.onTransition) {
      this.props.onTransition();
    }
  },

  /**
   * Render some children in a transitionable way.
   */
  renderTransitionableChildren: function(sourceChildren) {
    var children = {};
    var childMapping = ReactTransitionKeySet.getChildMapping(sourceChildren);

    var renderKeys = ReactTransitionKeySet.getKeySet(sourceChildren);
    var currentKeys = ReactTransitionKeySet.mergeKeySets(
      this._transitionGroupCurrentKeys, renderKeys
    );

    var cascadeCounter = 0;
    var leaveCascadeCounter = 0;
    var cascadeDirection, leaveCascadeDirection;

    if (this.props.transitionStaggering ||
        this.props.transitionStaggeringDirectional) {
      var diffKeys = ReactTransitionKeySet.diffKeySets(
        this._transitionGroupCurrentKeys, renderKeys
      );
      var newKeys = diffKeys['new'];
      var removedKeys = diffKeys.removed;

      cascadeCounter = 0;
      cascadeDirection = 1;
      leaveCascadeDirection = -1;
      leaveCascadeCounter = Object.keys(removedKeys).length-1;
    }

    if (this.props.transitionStaggeringDirectional) {
      leaveCascadeCounter = 0;
      leaveCascadeDirection = 1;

      // Using an array on next ordered keys to allow
      // for checking whether the stagger required will be going backwards or
      // forwards through the render list.
      var nextOrdKeys = ReactTransitionKeySet.getOrderedKeys(sourceChildren);
      var nextLastKey = '{' + nextOrdKeys[nextOrdKeys.length-1] + '}';
      var prevFirstKey = '{' + this._transitionGroupLastVisibleOrder[0] + '}';

      if (!newKeys[nextLastKey]) {
        // if the last visible key is not a new one, assume the transition
        // direction is backwards
        cascadeDirection = -1;
        cascadeCounter = Object.keys(newKeys).length-1;
      }
      if (!removedKeys[prevFirstKey]) {
        // if the first visible key is not a removed one, assume the leave
        // transition direction is backwards
        leaveCascadeDirection = -1;
        leaveCascadeCounter = Object.keys(removedKeys).length-1;
      }
      this._transitionGroupLastVisibleOrder = nextOrdKeys;
    }

    for (var key in currentKeys) {
      // Here is how we keep the nodes in the DOM. ReactTransitionableChild
      // knows how to hold onto its child if it changes to undefined. Here, we
      // may look up an old key in the new children, and it may switch to
      // undefined. React's reconciler will keep the ReactTransitionableChild
      // instance alive such that we can animate it.
      if (childMapping[key] || this.props.transitionLeave) {
        children[key] = ReactTransitionableChild({
          name: this.props.transitionName,
          cascade: cascadeCounter,
          leaveCascade: leaveCascadeCounter,
          enter: this.props.transitionEnter,
          onDoneLeaving: this._handleDoneLeaving.bind(this, key)
        }, childMapping[key]);
      } else {
        // If there's no leave transition and the child has been removed from
        // the source children list, we want to remove it immediately from the
        // _transitionGroupCurrentKeys cache because _handleDoneLeaving won't
        // be called. In normal cases, this prevents a small memory leak; in
        // the case of switching transitionLeave from false to true, it
        // prevents a confusing bug where ReactTransitionableChild.render()
        // returns nothing, throwing an error.
        delete currentKeys[key];
      }
      if (this.props.transitionStaggering ||
          this.props.transitionStaggeringDirectional) {
        if (newKeys[key]) { cascadeCounter += cascadeDirection; }
        if (removedKeys[key]) { leaveCascadeCounter += leaveCascadeDirection; }
      }
    }

    this._transitionGroupCurrentKeys = currentKeys;

    return children;
  },

  _handleDoneLeaving: function(key) {
    // When the leave animation finishes, we should blow away the actual DOM
    // node.
    delete this._transitionGroupCurrentKeys[key];
    this.forceUpdate();
  },

  render: function() {
    return this.transferPropsTo(
      this.props.component(
        {
          transitionName: null,
          transitionEnter: null,
          transitionLeave: null,
          component: null
        },
        this.renderTransitionableChildren(this.props.children)
      )
    );
  }
});

module.exports = ReactTransitionGroup;
