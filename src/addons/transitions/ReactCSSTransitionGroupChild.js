/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactCSSTransitionGroupChild
 */

'use strict';

var React = require('react');
var ReactAddonsDOMDependencies = require('ReactAddonsDOMDependencies');

var CSSCore = require('fbjs/lib/CSSCore');
var ReactTransitionEvents = require('ReactTransitionEvents');

var onlyChild = require('onlyChild');

var TICK = 17;

var ReactCSSTransitionGroupChild = React.createClass({
  displayName: 'ReactCSSTransitionGroupChild',

  propTypes: {
    name: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.shape({
        enter: React.PropTypes.string,
        leave: React.PropTypes.string,
        active: React.PropTypes.string,
      }),
      React.PropTypes.shape({
        enter: React.PropTypes.string,
        enterActive: React.PropTypes.string,
        leave: React.PropTypes.string,
        leaveActive: React.PropTypes.string,
        appear: React.PropTypes.string,
        appearActive: React.PropTypes.string,
      }),
    ]).isRequired,

    // Once we require timeouts to be specified, we can remove the
    // boolean flags (appear etc.) and just accept a number
    // or a bool for the timeout flags (appearTimeout etc.)
    appear: React.PropTypes.bool,
    enter: React.PropTypes.bool,
    leave: React.PropTypes.bool,
    appearTimeout: React.PropTypes.number,
    enterTimeout: React.PropTypes.number,
    leaveTimeout: React.PropTypes.number,
  },

  transition: function(animationType, finishCallback, userSpecifiedDelay) {
    var node = ReactAddonsDOMDependencies.getReactDOM().findDOMNode(this);

    if (!node) {
      if (finishCallback) {
        finishCallback();
      }
      return;
    }

    var className = this.props.name[animationType] ||
      this.props.name + '-' + animationType;
    var activeClassName = this.props.name[animationType + 'Active'] ||
      className + '-active';
    var timeout = null;

    var endListener = function(e) {
      if (e && e.target !== node) {
        return;
      }

      clearTimeout(timeout);

      CSSCore.removeClass(node, className);
      CSSCore.removeClass(node, activeClassName);

      ReactTransitionEvents.removeEndEventListener(node, endListener);

      // Usually this optional callback is used for informing an owner of
      // a leave animation and telling it to remove the child.
      if (finishCallback) {
        finishCallback();
      }
    };

    CSSCore.addClass(node, className);

    // Need to do this to actually trigger a transition.
    this.queueClassAndNode(activeClassName, node);

    // If the user specified a timeout delay.
    if (userSpecifiedDelay) {
      // Clean-up the animation after the specified delay
      timeout = setTimeout(endListener, userSpecifiedDelay);
      this.transitionTimeouts.push(timeout);
    } else {
      // DEPRECATED: this listener will be removed in a future version of react
      ReactTransitionEvents.addEndEventListener(node, endListener);
    }
  },

  queueClassAndNode: function(className, node) {
    this.classNameAndNodeQueue.push({
      className: className,
      node: node,
    });

    if (!this.timeout) {
      this.timeout = setTimeout(this.flushClassNameAndNodeQueue, TICK);
    }
  },

  flushClassNameAndNodeQueue: function() {
    if (this.isMounted()) {
      this.classNameAndNodeQueue.forEach(function(obj) {
        CSSCore.addClass(obj.node, obj.className);
      });
    }
    this.classNameAndNodeQueue.length = 0;
    this.timeout = null;
  },

  componentWillMount: function() {
    this.classNameAndNodeQueue = [];
    this.transitionTimeouts = [];
  },

  componentWillUnmount: function() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.transitionTimeouts.forEach(function(timeout) {
      clearTimeout(timeout);
    });

    this.classNameAndNodeQueue.length = 0;
  },

  componentWillAppear: function(done) {
    if (this.props.appear) {
      this.transition('appear', done, this.props.appearTimeout);
    } else {
      done();
    }
  },

  componentWillEnter: function(done) {
    if (this.props.enter) {
      this.transition('enter', done, this.props.enterTimeout);
    } else {
      done();
    }
  },

  componentWillLeave: function(done) {
    if (this.props.leave) {
      this.transition('leave', done, this.props.leaveTimeout);
    } else {
      done();
    }
  },

  render: function() {
    return onlyChild(this.props.children);
  },
});

module.exports = ReactCSSTransitionGroupChild;
