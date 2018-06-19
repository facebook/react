/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import {isForwardRef} from 'react-is';
import describeComponentFrame from 'shared/describeComponentFrame';
import getComponentName from 'shared/getComponentName';
import shallowEqual from 'shared/shallowEqual';
import invariant from 'fbjs/lib/invariant';
import checkPropTypes from 'prop-types/checkPropTypes';

const emptyObject = {};
if (__DEV__) {
  Object.freeze(emptyObject);
}

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
    this._rendering = false;
    this._forcedUpdate = false;
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
    // Show a special message for host elements since it's a common case.
    invariant(
      typeof element.type !== 'string',
      'ReactShallowRenderer render(): Shallow rendering works only with custom ' +
        'components, not primitives (%s). Instead of calling `.render(el)` and ' +
        'inspecting the rendered output, look at `el.props` directly instead.',
      element.type,
    );
    invariant(
      isForwardRef(element) || typeof element.type === 'function',
      'ReactShallowRenderer render(): Shallow rendering works only with custom ' +
        'components, but the provided element type was `%s`.',
      Array.isArray(element.type)
        ? 'array'
        : element.type === null ? 'null' : typeof element.type,
    );

    if (this._rendering) {
      return;
    }

    this._rendering = true;
    this._element = element;
    this._context = getMaskedContext(element.type.contextTypes, context);

    if (this._instance) {
      this._updateClassComponent(element, this._context);
    } else {
      if (isForwardRef(element)) {
        this._rendered = element.type.render(element.props, element.ref);
      } else if (shouldConstruct(element.type)) {
        this._instance = new element.type(
          element.props,
          this._context,
          this._updater,
        );

        this._updateStateFromStaticLifecycle(element.props);

        if (element.type.hasOwnProperty('contextTypes')) {
          currentlyValidatingElement = element;

          checkPropTypes(
            element.type.contextTypes,
            this._context,
            'context',
            getName(element.type, this._instance),
            getStackAddendum,
          );

          currentlyValidatingElement = null;
        }

        this._mountClassComponent(element, this._context);
      } else {
        this._rendered = element.type(element.props, this._context);
      }
    }

    this._rendering = false;
    this._updater._invokeCallbacks();

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

  _mountClassComponent(element, context) {
    this._instance.context = context;
    this._instance.props = element.props;
    this._instance.state = this._instance.state || null;
    this._instance.updater = this._updater;

    if (
      typeof this._instance.UNSAFE_componentWillMount === 'function' ||
      typeof this._instance.componentWillMount === 'function'
    ) {
      const beforeState = this._newState;

      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for components using the new APIs.
      if (
        typeof element.type.getDerivedStateFromProps !== 'function' &&
        typeof this._instance.getSnapshotBeforeUpdate !== 'function'
      ) {
        if (typeof this._instance.componentWillMount === 'function') {
          this._instance.componentWillMount();
        }
        if (typeof this._instance.UNSAFE_componentWillMount === 'function') {
          this._instance.UNSAFE_componentWillMount();
        }
      }

      // setState may have been called during cWM
      if (beforeState !== this._newState) {
        this._instance.state = this._newState || emptyObject;
      }
    }

    this._rendered = this._instance.render();
    // Intentionally do not call componentDidMount()
    // because DOM refs are not available.
  }

  _updateClassComponent(element, context) {
    const {props, type} = element;

    const oldState = this._instance.state || emptyObject;
    const oldProps = this._instance.props;

    if (oldProps !== props) {
      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for components using the new APIs.
      if (
        typeof element.type.getDerivedStateFromProps !== 'function' &&
        typeof this._instance.getSnapshotBeforeUpdate !== 'function'
      ) {
        if (typeof this._instance.componentWillReceiveProps === 'function') {
          this._instance.componentWillReceiveProps(props, context);
        }
        if (
          typeof this._instance.UNSAFE_componentWillReceiveProps === 'function'
        ) {
          this._instance.UNSAFE_componentWillReceiveProps(props, context);
        }
      }
    }
    this._updateStateFromStaticLifecycle(props);

    // Read state after cWRP in case it calls setState
    const state = this._newState || oldState;

    let shouldUpdate = true;
    if (this._forcedUpdate) {
      shouldUpdate = true;
      this._forcedUpdate = false;
    } else if (typeof this._instance.shouldComponentUpdate === 'function') {
      shouldUpdate = !!this._instance.shouldComponentUpdate(
        props,
        state,
        context,
      );
    } else if (type.prototype && type.prototype.isPureReactComponent) {
      shouldUpdate =
        !shallowEqual(oldProps, props) || !shallowEqual(oldState, state);
    }

    if (shouldUpdate) {
      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for components using the new APIs.
      if (
        typeof element.type.getDerivedStateFromProps !== 'function' &&
        typeof this._instance.getSnapshotBeforeUpdate !== 'function'
      ) {
        if (typeof this._instance.componentWillUpdate === 'function') {
          this._instance.componentWillUpdate(props, state, context);
        }
        if (typeof this._instance.UNSAFE_componentWillUpdate === 'function') {
          this._instance.UNSAFE_componentWillUpdate(props, state, context);
        }
      }
    }

    this._instance.context = context;
    this._instance.props = props;
    this._instance.state = state;

    if (shouldUpdate) {
      this._rendered = this._instance.render();
    }
    // Intentionally do not call componentDidUpdate()
    // because DOM refs are not available.
  }

  _updateStateFromStaticLifecycle(props) {
    const {type} = this._element;

    if (typeof type.getDerivedStateFromProps === 'function') {
      const oldState = this._newState || this._instance.state;
      const partialState = type.getDerivedStateFromProps.call(
        null,
        props,
        oldState,
      );

      if (partialState != null) {
        const newState = Object.assign({}, oldState, partialState);
        this._instance.state = this._newState = newState;
      }
    }
  }
}

class Updater {
  constructor(renderer) {
    this._renderer = renderer;
    this._callbacks = [];
  }

  _enqueueCallback(callback, publicInstance) {
    if (typeof callback === 'function' && publicInstance) {
      this._callbacks.push({
        callback,
        publicInstance,
      });
    }
  }

  _invokeCallbacks() {
    const callbacks = this._callbacks;
    this._callbacks = [];

    callbacks.forEach(({callback, publicInstance}) => {
      callback.call(publicInstance);
    });
  }

  isMounted(publicInstance) {
    return !!this._renderer._element;
  }

  enqueueForceUpdate(publicInstance, callback, callerName) {
    this._enqueueCallback(callback, publicInstance);
    this._renderer._forcedUpdate = true;
    this._renderer.render(this._renderer._element, this._renderer._context);
  }

  enqueueReplaceState(publicInstance, completeState, callback, callerName) {
    this._enqueueCallback(callback, publicInstance);
    this._renderer._newState = completeState;
    this._renderer.render(this._renderer._element, this._renderer._context);
  }

  enqueueSetState(publicInstance, partialState, callback, callerName) {
    this._enqueueCallback(callback, publicInstance);
    const currentState = this._renderer._newState || publicInstance.state;

    if (typeof partialState === 'function') {
      partialState = partialState.call(
        publicInstance,
        currentState,
        publicInstance.props,
      );
    }

    // Null and undefined are treated as no-ops.
    if (partialState === null || partialState === undefined) {
      return;
    }

    this._renderer._newState = {
      ...currentState,
      ...partialState,
    };

    this._renderer.render(this._renderer._element, this._renderer._context);
  }
}

let currentlyValidatingElement = null;

function getDisplayName(element) {
  if (element == null) {
    return '#empty';
  } else if (typeof element === 'string' || typeof element === 'number') {
    return '#text';
  } else if (typeof element.type === 'string') {
    return element.type;
  } else {
    return element.type.displayName || element.type.name || 'Unknown';
  }
}

function getStackAddendum() {
  let stack = '';
  if (currentlyValidatingElement) {
    const name = getDisplayName(currentlyValidatingElement);
    const owner = currentlyValidatingElement._owner;
    stack += describeComponentFrame(
      name,
      currentlyValidatingElement._source,
      owner && getComponentName(owner),
    );
  }
  return stack;
}

function getName(type, instance) {
  const constructor = instance && instance.constructor;
  return (
    type.displayName ||
    (constructor && constructor.displayName) ||
    type.name ||
    (constructor && constructor.name) ||
    null
  );
}

function shouldConstruct(Component) {
  return !!(Component.prototype && Component.prototype.isReactComponent);
}

function getMaskedContext(contextTypes, unmaskedContext) {
  if (!contextTypes) {
    return emptyObject;
  }
  const context = {};
  for (let key in contextTypes) {
    context[key] = unmaskedContext[key];
  }
  return context;
}

export default ReactShallowRenderer;
