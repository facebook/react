/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactShallowRendererEntry
 * @preventMunge
 */

'use strict';

const checkPropTypes = require('prop-types/checkPropTypes');
const React = require('react');

const emptyObject = require('fbjs/lib/emptyObject');
const invariant = require('fbjs/lib/invariant');

if (__DEV__) {
  var describeComponentFrame = require('describeComponentFrame');
  var getComponentName = require('getComponentName');

  var currentlyValidatingElement = null;

  var getDisplayName = function(element: ?ReactElement): string {
    if (element == null) {
      return '#empty';
    } else if (typeof element === 'string' || typeof element === 'number') {
      return '#text';
    } else if (typeof element.type === 'string') {
      return element.type;
    } else {
      return element.type.displayName || element.type.name || 'Unknown';
    }
  };

  var getStackAddendum = function(): string {
    var stack = '';
    if (currentlyValidatingElement) {
      var name = getDisplayName(currentlyValidatingElement);
      var owner = currentlyValidatingElement._owner;
      stack += describeComponentFrame(
        name,
        currentlyValidatingElement._source,
        owner && getComponentName(owner),
      );
    }
    return stack;
  };
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

    if (this._rendering) {
      return;
    }

    this._rendering = true;
    this._element = element;
    this._context = context;

    if (this._instance) {
      this._updateClassComponent(element.props, context);
    } else {
      if (shouldConstruct(element.type)) {
        this._instance = new element.type(
          element.props,
          context,
          this._updater,
        );

        if (element.type.hasOwnProperty('contextTypes')) {
          currentlyValidatingElement = element;

          checkPropTypes(
            element.type.contextTypes,
            context,
            'context',
            getName(element.type, this._instance),
            getStackAddendum,
          );

          currentlyValidatingElement = null;
        }

        this._mountClassComponent(element.props, context);
      } else {
        this._rendered = element.type(element.props, context);
      }
    }

    this._rendering = false;

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

  _mountClassComponent(props, context) {
    this._instance.context = context;
    this._instance.props = props;
    this._instance.state = this._instance.state || emptyObject;
    this._instance.updater = this._updater;

    if (typeof this._instance.componentWillMount === 'function') {
      const beforeState = this._newState;

      this._instance.componentWillMount();

      // setState may have been called during cWM
      if (beforeState !== this._newState) {
        this._instance.state = this._newState || emptyObject;
      }
    }

    this._rendered = this._instance.render();

    // Calling cDU might lead to problems with host component references.
    // Since our components aren't really mounted, refs won't be available.
    // if (typeof this._instance.componentDidMount === 'function') {
    //   this._instance.componentDidMount();
    // }
  }

  _updateClassComponent(props, context) {
    const oldProps = this._instance.props;
    const oldState = this._instance.state;

    if (
      oldProps !== props &&
      typeof this._instance.componentWillReceiveProps === 'function'
    ) {
      this._instance.componentWillReceiveProps(props);
    }

    // Read state after cWRP in case it calls setState
    // Fallback to previous instance state to support rendering React.cloneElement()
    const state = this._newState || this._instance.state || emptyObject;

    if (typeof this._instance.shouldComponentUpdate === 'function') {
      if (
        this._instance.shouldComponentUpdate(props, state, context) === false
      ) {
        this._instance.context = context;
        this._instance.props = props;
        this._instance.state = state;

        return;
      }
    }

    if (typeof this._instance.componentWillUpdate === 'function') {
      this._instance.componentWillUpdate(props, state, context);
    }

    this._instance.context = context;
    this._instance.props = props;
    this._instance.state = state;

    this._rendered = this._instance.render();

    // The 15.x shallow renderer triggered cDU for setState() calls only.
    if (
      oldState !== state &&
      typeof this._instance.componentDidUpdate === 'function'
    ) {
      this._instance.componentDidUpdate(oldProps, oldState);
    }
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

    if (typeof callback === 'function') {
      callback.call(publicInstance);
    }
  }

  enqueueReplaceState(publicInstance, completeState, callback, callerName) {
    this._renderer._newState = completeState;
    this._renderer.render(this._renderer._element, this._renderer._context);

    if (typeof callback === 'function') {
      callback.call(publicInstance);
    }
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

    if (typeof callback === 'function') {
      callback.call(publicInstance);
    }
  }
}

function getName(type, instance) {
  var constructor = instance && instance.constructor;
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

module.exports = ReactShallowRenderer;
