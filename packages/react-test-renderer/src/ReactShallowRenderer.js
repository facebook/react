/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import {warnAboutDeprecatedLifecycles} from 'shared/ReactFeatureFlags';
import describeComponentFrame from 'shared/describeComponentFrame';
import getComponentName from 'shared/getComponentName';
import emptyObject from 'fbjs/lib/emptyObject';
import invariant from 'fbjs/lib/invariant';
import shallowEqual from 'fbjs/lib/shallowEqual';
import checkPropTypes from 'prop-types/checkPropTypes';
import warning from 'fbjs/lib/warning';

let didWarnAboutLegacyWillMount;
let didWarnAboutLegacyWillReceiveProps;
let didWarnAboutLegacyWillUpdate;
let didWarnAboutUndefinedDerivedState;
let didWarnAboutUninitializedState;
let didWarnAboutWillReceivePropsAndDerivedState;

if (__DEV__) {
  if (warnAboutDeprecatedLifecycles) {
    didWarnAboutLegacyWillMount = {};
    didWarnAboutLegacyWillReceiveProps = {};
    didWarnAboutLegacyWillUpdate = {};
  }
  didWarnAboutUndefinedDerivedState = {};
  didWarnAboutUninitializedState = {};
  didWarnAboutWillReceivePropsAndDerivedState = {};
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
      typeof element.type === 'function',
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
      if (shouldConstruct(element.type)) {
        this._instance = new element.type(
          element.props,
          this._context,
          this._updater,
        );

        if (__DEV__) {
          if (typeof element.type.getDerivedStateFromProps === 'function') {
            if (
              this._instance.state === null ||
              this._instance.state === undefined
            ) {
              const componentName =
                getName(element.type, this._instance) || 'Unknown';
              if (!didWarnAboutUninitializedState[componentName]) {
                warning(
                  false,
                  '%s: Did not properly initialize state during construction. ' +
                    'Expected state to be an object, but it was %s.',
                  componentName,
                  this._instance.state === null ? 'null' : 'undefined',
                );
                didWarnAboutUninitializedState[componentName] = true;
              }
            }
          }
        }

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

      if (typeof this._instance.componentWillMount === 'function') {
        if (__DEV__) {
          // Don't warn about react-lifecycles-compat polyfilled components
          if (
            warnAboutDeprecatedLifecycles &&
            this._instance.componentWillMount.__suppressDeprecationWarning !==
              true
          ) {
            const componentName = getName(element.type, this._instance);
            if (!didWarnAboutLegacyWillMount[componentName]) {
              warning(
                false,
                '%s: componentWillMount() is deprecated and will be ' +
                  'removed in the next major version. Read about the motivations ' +
                  'behind this change: ' +
                  'https://fb.me/react-async-component-lifecycle-hooks' +
                  '\n\n' +
                  'As a temporary workaround, you can rename to ' +
                  'UNSAFE_componentWillMount instead.',
                componentName,
              );
              didWarnAboutLegacyWillMount[componentName] = true;
            }
          }
        }

        // In order to support react-lifecycles-compat polyfilled components,
        // Unsafe lifecycles should not be invoked for any component with the new gDSFP.
        if (typeof element.type.getDerivedStateFromProps !== 'function') {
          this._instance.componentWillMount();
        }
      }
      if (
        typeof this._instance.UNSAFE_componentWillMount === 'function' &&
        typeof element.type.getDerivedStateFromProps !== 'function'
      ) {
        // In order to support react-lifecycles-compat polyfilled components,
        // Unsafe lifecycles should not be invoked for any component with the new gDSFP.
        this._instance.UNSAFE_componentWillMount();
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
      if (typeof this._instance.componentWillReceiveProps === 'function') {
        if (__DEV__) {
          if (warnAboutDeprecatedLifecycles) {
            const componentName = getName(element.type, this._instance);
            if (!didWarnAboutLegacyWillReceiveProps[componentName]) {
              warning(
                false,
                '%s: componentWillReceiveProps() is deprecated and ' +
                  'will be removed in the next major version. Use ' +
                  'static getDerivedStateFromProps() instead. Read about the ' +
                  'motivations behind this change: ' +
                  'https://fb.me/react-async-component-lifecycle-hooks' +
                  '\n\n' +
                  'As a temporary workaround, you can rename to ' +
                  'UNSAFE_componentWillReceiveProps instead.',
                componentName,
              );
              didWarnAboutLegacyWillReceiveProps[componentName] = true;
            }
          }
        }
        // In order to support react-lifecycles-compat polyfilled components,
        // Unsafe lifecycles should not be invoked for any component with the new gDSFP.
        if (typeof element.type.getDerivedStateFromProps !== 'function') {
          this._instance.componentWillReceiveProps(props, context);
        }
      }
      if (
        typeof this._instance.UNSAFE_componentWillReceiveProps === 'function' &&
        typeof element.type.getDerivedStateFromProps !== 'function'
      ) {
        // In order to support react-lifecycles-compat polyfilled components,
        // Unsafe lifecycles should not be invoked for any component with the new gDSFP.
        this._instance.UNSAFE_componentWillReceiveProps(props, context);
      }

      this._updateStateFromStaticLifecycle(props);
    }

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
      if (typeof this._instance.componentWillUpdate === 'function') {
        if (__DEV__) {
          if (warnAboutDeprecatedLifecycles) {
            const componentName = getName(element.type, this._instance);
            if (!didWarnAboutLegacyWillUpdate[componentName]) {
              warning(
                false,
                '%s: componentWillUpdate() is deprecated and will be ' +
                  'removed in the next major version. Read about the motivations ' +
                  'behind this change: ' +
                  'https://fb.me/react-async-component-lifecycle-hooks' +
                  '\n\n' +
                  'As a temporary workaround, you can rename to ' +
                  'UNSAFE_componentWillUpdate instead.',
                componentName,
              );
              didWarnAboutLegacyWillUpdate[componentName] = true;
            }
          }
        }

        // In order to support react-lifecycles-compat polyfilled components,
        // Unsafe lifecycles should not be invoked for any component with the new gDSFP.
        if (typeof type.getDerivedStateFromProps !== 'function') {
          this._instance.componentWillUpdate(props, state, context);
        }
      }
      if (
        typeof this._instance.UNSAFE_componentWillUpdate === 'function' &&
        typeof type.getDerivedStateFromProps !== 'function'
      ) {
        // In order to support react-lifecycles-compat polyfilled components,
        // Unsafe lifecycles should not be invoked for any component with the new gDSFP.
        this._instance.UNSAFE_componentWillUpdate(props, state, context);
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
      if (__DEV__) {
        // Don't warn about react-lifecycles-compat polyfilled components
        if (
          (typeof this._instance.componentWillReceiveProps === 'function' &&
            this._instance.componentWillReceiveProps
              .__suppressDeprecationWarning !== true) ||
          typeof this._instance.UNSAFE_componentWillReceiveProps === 'function'
        ) {
          const componentName = getName(type, this._instance);
          if (!didWarnAboutWillReceivePropsAndDerivedState[componentName]) {
            warning(
              false,
              '%s: Defines both componentWillReceiveProps() and static ' +
                'getDerivedStateFromProps() methods. We recommend using ' +
                'only getDerivedStateFromProps().',
              componentName,
            );
            didWarnAboutWillReceivePropsAndDerivedState[componentName] = true;
          }
        }
      }

      const partialState = type.getDerivedStateFromProps.call(
        null,
        props,
        this._instance.state,
      );

      if (__DEV__) {
        if (partialState === undefined) {
          const componentName = getName(type, this._instance);
          if (!didWarnAboutUndefinedDerivedState[componentName]) {
            warning(
              false,
              '%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. ' +
                'You have returned undefined.',
              componentName,
            );
            didWarnAboutUndefinedDerivedState[componentName] = componentName;
          }
        }
      }

      if (partialState != null) {
        const oldState = this._newState || this._instance.state;
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
      partialState = partialState(currentState, publicInstance.props);
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
