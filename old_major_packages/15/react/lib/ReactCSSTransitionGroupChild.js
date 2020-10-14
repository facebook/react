/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('./React');
var ReactAddonsDOMDependencies = require('./ReactAddonsDOMDependencies');

var propTypesFactory = require('prop-types/factory');
var PropTypes = propTypesFactory(React.isValidElement);

var CSSCore = require('fbjs/lib/CSSCore');
var ReactTransitionEvents = require('./ReactTransitionEvents');

var onlyChild = require('./onlyChild');

var TICK = 17;

var ReactCSSTransitionGroupChild = function (_React$Component) {
  _inherits(ReactCSSTransitionGroupChild, _React$Component);

  function ReactCSSTransitionGroupChild() {
    var _temp, _this, _ret;

    _classCallCheck(this, ReactCSSTransitionGroupChild);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, _React$Component.call.apply(_React$Component, [this].concat(args))), _this), _this._isMounted = false, _this.transition = function (animationType, finishCallback, userSpecifiedDelay) {
      var node = ReactAddonsDOMDependencies.getReactDOM().findDOMNode(_this);

      if (!node) {
        if (finishCallback) {
          finishCallback();
        }
        return;
      }

      var className = _this.props.name[animationType] || _this.props.name + '-' + animationType;
      var activeClassName = _this.props.name[animationType + 'Active'] || className + '-active';
      var timeout = null;

      var endListener = function (e) {
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
      _this.queueClassAndNode(activeClassName, node);

      // If the user specified a timeout delay.
      if (userSpecifiedDelay) {
        // Clean-up the animation after the specified delay
        timeout = setTimeout(endListener, userSpecifiedDelay);
        _this.transitionTimeouts.push(timeout);
      } else {
        // DEPRECATED: this listener will be removed in a future version of react
        ReactTransitionEvents.addEndEventListener(node, endListener);
      }
    }, _this.queueClassAndNode = function (className, node) {
      _this.classNameAndNodeQueue.push({
        className: className,
        node: node
      });

      if (!_this.timeout) {
        _this.timeout = setTimeout(_this.flushClassNameAndNodeQueue, TICK);
      }
    }, _this.flushClassNameAndNodeQueue = function () {
      if (_this._isMounted) {
        _this.classNameAndNodeQueue.forEach(function (obj) {
          CSSCore.addClass(obj.node, obj.className);
        });
      }
      _this.classNameAndNodeQueue.length = 0;
      _this.timeout = null;
    }, _this.componentWillAppear = function (done) {
      if (_this.props.appear) {
        _this.transition('appear', done, _this.props.appearTimeout);
      } else {
        done();
      }
    }, _this.componentWillEnter = function (done) {
      if (_this.props.enter) {
        _this.transition('enter', done, _this.props.enterTimeout);
      } else {
        done();
      }
    }, _this.componentWillLeave = function (done) {
      if (_this.props.leave) {
        _this.transition('leave', done, _this.props.leaveTimeout);
      } else {
        done();
      }
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  ReactCSSTransitionGroupChild.prototype.componentWillMount = function componentWillMount() {
    this.classNameAndNodeQueue = [];
    this.transitionTimeouts = [];
  };

  ReactCSSTransitionGroupChild.prototype.componentDidMount = function componentDidMount() {
    this._isMounted = true;
  };

  ReactCSSTransitionGroupChild.prototype.componentWillUnmount = function componentWillUnmount() {
    this._isMounted = false;

    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.transitionTimeouts.forEach(function (timeout) {
      clearTimeout(timeout);
    });

    this.classNameAndNodeQueue.length = 0;
  };

  ReactCSSTransitionGroupChild.prototype.render = function render() {
    return onlyChild(this.props.children);
  };

  return ReactCSSTransitionGroupChild;
}(React.Component);

ReactCSSTransitionGroupChild.propTypes = {
  name: PropTypes.oneOfType([PropTypes.string, PropTypes.shape({
    enter: PropTypes.string,
    leave: PropTypes.string,
    active: PropTypes.string
  }), PropTypes.shape({
    enter: PropTypes.string,
    enterActive: PropTypes.string,
    leave: PropTypes.string,
    leaveActive: PropTypes.string,
    appear: PropTypes.string,
    appearActive: PropTypes.string
  })]).isRequired,

  // Once we require timeouts to be specified, we can remove the
  // boolean flags (appear etc.) and just accept a number
  // or a bool for the timeout flags (appearTimeout etc.)
  appear: PropTypes.bool,
  enter: PropTypes.bool,
  leave: PropTypes.bool,
  appearTimeout: PropTypes.number,
  enterTimeout: PropTypes.number,
  leaveTimeout: PropTypes.number
};


module.exports = ReactCSSTransitionGroupChild;