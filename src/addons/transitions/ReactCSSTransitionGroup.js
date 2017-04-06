/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactCSSTransitionGroup
 */

'use strict';

var React = require('React');
var PropTypes = require('prop-types');

var ReactTransitionGroup = require('ReactTransitionGroup');
var ReactCSSTransitionGroupChild = require('ReactCSSTransitionGroupChild');

function createTransitionTimeoutPropValidator(transitionType) {
  var timeoutPropName = 'transition' + transitionType + 'Timeout';
  var enabledPropName = 'transition' + transitionType;

  return function(props) {
    // If the transition is enabled
    if (props[enabledPropName]) {
      // If no timeout duration is provided
      if (props[timeoutPropName] == null) {
        return new Error(
          timeoutPropName + ' wasn\'t supplied to ReactCSSTransitionGroup: ' +
          'this can cause unreliable animations and won\'t be supported in ' +
          'a future version of React. See ' +
          'https://fb.me/react-animation-transition-group-timeout for more ' +
          'information.'
        );

      // If the duration isn't a number
      } else if (typeof props[timeoutPropName] !== 'number') {
        return new Error(timeoutPropName + ' must be a number (in milliseconds)');
      }
    }
  };
}

/**
 * An easy way to perform CSS transitions and animations when a React component
 * enters or leaves the DOM.
 * See https://facebook.github.io/react/docs/animation.html#high-level-api-reactcsstransitiongroup
 */
class ReactCSSTransitionGroup extends React.Component {
  static displayName = 'ReactCSSTransitionGroup';

  static propTypes = {
    transitionName: ReactCSSTransitionGroupChild.propTypes.name,

    transitionAppear: PropTypes.bool,
    transitionEnter: PropTypes.bool,
    transitionLeave: PropTypes.bool,
    transitionAppearTimeout: createTransitionTimeoutPropValidator('Appear'),
    transitionEnterTimeout: createTransitionTimeoutPropValidator('Enter'),
    transitionLeaveTimeout: createTransitionTimeoutPropValidator('Leave'),
  };

  static defaultProps = {
    transitionAppear: false,
    transitionEnter: true,
    transitionLeave: true,
  };

  _wrapChild = (child) => {
    // We need to provide this childFactory so that
    // ReactCSSTransitionGroupChild can receive updates to name, enter, and
    // leave while it is leaving.
    return React.createElement(
      ReactCSSTransitionGroupChild,
      {
        name: this.props.transitionName,
        appear: this.props.transitionAppear,
        enter: this.props.transitionEnter,
        leave: this.props.transitionLeave,
        appearTimeout: this.props.transitionAppearTimeout,
        enterTimeout: this.props.transitionEnterTimeout,
        leaveTimeout: this.props.transitionLeaveTimeout,
      },
      child
    );
  };

  render() {
    return React.createElement(
      ReactTransitionGroup,
      Object.assign({}, this.props, {childFactory: this._wrapChild})
    );
  }
}

module.exports = ReactCSSTransitionGroup;
