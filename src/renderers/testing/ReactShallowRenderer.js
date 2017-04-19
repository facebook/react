/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactShallowRenderer
 * @preventMunge
 */

'use strict';

const checkPropTypes = require('prop-types/checkPropTypes');
const React = require('react');

const emptyObject = require('fbjs/lib/emptyObject');
const invariant = require('fbjs/lib/invariant');

const {ReactDebugCurrentFrame} = require('ReactGlobalSharedState');

class ReactShallowRenderer {
  static createRenderer = function() {
    return new ReactShallowRenderer();
  };

  constructor() {
    this._context = null;
    this._element = null;
    this._instance = null;
    this._newState = null;
    this._rendered = null;
    this._updater = new Updater(this);
  }

  getMountedInstance() {
    return this._instance;
  }

  getRenderOutput() {
    return this._rendered;
  }

  render(element, context = emptyObject) {
    invariant(
      React.isValidElement(element),
      'ReactShallowRenderer render(): Invalid component element.%s',
      typeof element === 'function'
        ? ' Instead of passing a component class, make sure to instantiate ' +
            'it by passing it to React.createElement.'
        : '',
    );
    invariant(
      typeof element.type !== 'string',
      'ReactShallowRenderer render(): Shallow rendering works only with custom ' +
        'components, not primitives (%s). Instead of calling `.render(el)` and ' +
        'inspecting the rendered output, look at `el.props` directly instead.',
      element.type,
    );

    this._element = element;
    this._context = context;

    if (this._instance) {
      this._rendered = updateClassComponent(
        this._instance,
        this._rendered,
        element.props,
        this._newState,
        context,
      );
    } else {
      if (shouldConstruct(element.type)) {
        this._instance = new element.type(element.props, context);

        if (element.type.hasOwnProperty('contextTypes')) {
          ReactDebugCurrentFrame.element = element;

          checkPropTypes(
            element.type.contextTypes,
            context,
            'context',
            getName(element.type, this._instance),
            ReactDebugCurrentFrame.getStackAddendum,
          );

          ReactDebugCurrentFrame.element = null;
        }

        this._rendered = mountClassComponent(
          this._instance,
          element.props,
          context,
          this._updater,
        );
      } else {
        this._rendered = element.type(element.props, context);
      }
    }

    return this.getRenderOutput();
  }

  unmount() {
    if (this._instance) {
      if (typeof this._instance.componentWillUnmount === 'function') {
        this._instance.componentWillUnmount();
      }
    }

    this._context = null;
    this._element = null;
    this._newState = null;
    this._rendered = null;
    this._instance = null;
  }
}

class Updater {
  constructor(renderer) {
    this._renderer = renderer;
  }

  isMounted(publicInstance) {
    return !!this._renderer._element;
  }

  enqueueForceUpdate(publicInstance, callback, callerName) {
    this._renderer.render(this._renderer._element, this._renderer._context);
  }

  enqueueReplaceState(publicInstance, completeState, callback, callerName) {
    this._renderer._newState = completeState;
    this._renderer.render(this._renderer._element, this._renderer._context);
  }

  enqueueSetState(publicInstance, partialState, callback, callerName) {
    if (typeof partialState === 'function') {
      partialState = partialState(publicInstance.state, publicInstance.props);
    }

    this._renderer._newState = {
      ...publicInstance.state,
      ...partialState,
    };

    this._renderer.render(this._renderer._element, this._renderer._context);
  }
}

function getName(type, instance) {
  var constructor = instance && instance.constructor;
  return type.displayName ||
    (constructor && constructor.displayName) ||
    type.name ||
    (constructor && constructor.name) ||
    null;
}

function mountClassComponent(instance, props, context, updater) {
  instance.context = context;
  instance.props = props;
  instance.state = instance.state || emptyObject;
  instance.updater = updater;

  if (typeof instance.componentWillMount === 'function') {
    instance.componentWillMount();
  }

  const rendered = instance.render();

  // Calling cDU might lead to problems with host component references.
  // Since our components aren't really mounted, refs won't be available.
  // if (typeof instance.componentDidMount === 'function') {
  //   instance.componentDidMount();
  // }

  return rendered;
}

function shouldConstruct(Component) {
  return !!(Component.prototype && Component.prototype.isReactComponent);
}

function updateClassComponent(instance, rendered, props, state, context) {
  state = state || emptyObject;

  const oldProps = instance.props;
  const oldState = instance.state;

  if (
    oldProps !== props &&
    typeof instance.componentWillReceiveProps === 'function'
  ) {
    instance.componentWillReceiveProps(props);
  }

  if (typeof instance.shouldComponentUpdate === 'function') {
    if (instance.shouldComponentUpdate(props, state, context) === false) {
      instance.context = context;
      instance.props = props;
      instance.state = state;

      return rendered;
    }
  }

  if (typeof instance.componentWillUpdate === 'function') {
    instance.componentWillUpdate(props, state, context);
  }

  instance.context = context;
  instance.props = props;
  instance.state = state;

  rendered = instance.render();

  // The 15.x shallow renderer triggered cDU for setState() calls only.
  if (oldState !== state && typeof instance.componentDidUpdate === 'function') {
    instance.componentDidUpdate(oldProps, oldState);
  }

  return rendered;
}

module.exports = ReactShallowRenderer;
