/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactCSSTransitionGroupChild
 */

'use strict';

var React = require('React');
var ReactAddonsDOMDependencies = require('ReactAddonsDOMDependencies');

var propTypesFactory = require('prop-types/factory');
var PropTypes = propTypesFactory(React.isValidElement);

var CSSCore = require('CSSCore');
var ReactTransitionEvents = require('ReactTransitionEvents');

var onlyChild = require('onlyChild');

var TICK = 17;

class ReactCSSTransitionGroupChild extends React.Component {
  static propTypes = {
    name: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        enter: PropTypes.string,
        leave: PropTypes.string,
        active: PropTypes.string,
      }),
      PropTypes.shape({
        enter: PropTypes.string,
        enterActive: PropTypes.string,
        leave: PropTypes.string,
        leaveActive: PropTypes.string,
        appear: PropTypes.string,
        appearActive: PropTypes.string,
      }),
    ]).isRequired,

    // Once we require timeouts to be specified, we can remove the
    // boolean flags (appear etc.) and just accept a number
    // or a bool for the timeout flags (appearTimeout etc.)
    appear: PropTypes.bool,
    enter: PropTypes.bool,
    leave: PropTypes.bool,
    appearTimeout: PropTypes.number,
    enterTimeout: PropTypes.number,
    leaveTimeout: PropTypes.number,
  };

  _isMounted = false;

  transition = (animationType, finishCallback, userSpecifiedDelay) => {
    var node = ReactAddonsDOMDependencies.getReactDOM().findDOMNode(this);

    if (!node) {
      if (finishCallback) {
        finishCallback();
      }
      return;
    }

    var className =
      this.props.name[animationType] || this.props.name + '-' + animationType;
    var activeClassName =
      this.props.name[animationType + 'Active'] || className + '-active';
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
  };

  queueClassAndNode = (className, node) => {
    this.classNameAndNodeQueue.push({
      className: className,
      node: node,
    });

    if (!this.timeout) {
      this.timeout = setTimeout(this.flushClassNameAndNodeQueue, TICK);
    }
  };

  flushClassNameAndNodeQueue = () => {
    if (this._isMounted) {
      this.classNameAndNodeQueue.forEach(function(obj) {
        CSSCore.addClass(obj.node, obj.className);
      });
    }
    this.classNameAndNodeQueue.length = 0;
    this.timeout = null;
  };

  componentWillMount() {
    this.classNameAndNodeQueue = [];
    this.transitionTimeouts = [];
  }

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;

    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.transitionTimeouts.forEach(function(timeout) {
      clearTimeout(timeout);
    });

    this.classNameAndNodeQueue.length = 0;
  }

  componentWillAppear = done => {
    if (this.props.appear) {
      this.transition('appear', done, this.props.appearTimeout);
    } else {
      done();
    }
  };

  componentWillEnter = done => {
    if (this.props.enter) {
      this.transition('enter', done, this.props.enterTimeout);
    } else {
      done();
    }
  };

  componentWillLeave = done => {
    if (this.props.leave) {
      this.transition('leave', done, this.props.leaveTimeout);
    } else {
      done();
    }
  };

  render() {
    return onlyChild(this.props.children);
  }
}

module.exports = ReactCSSTransitionGroupChild;
