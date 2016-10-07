/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactShallowRenderer
 */

'use strict';

var React = require('React');
var ReactDefaultInjection = require('ReactDefaultInjection');
var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactReconciler = require('ReactReconciler');
var ReactUpdates = require('ReactUpdates');

var emptyObject = require('emptyObject');
var invariant = require('invariant');

var nextDebugID = 1;

class NoopInternalComponent {
  constructor(element) {
    this._renderedOutput = element;
    this._currentElement = element;

    if (__DEV__) {
      this._debugID = nextDebugID++;
    }
  }
  mountComponent() {}
  receiveComponent(element) {
    this._renderedOutput = element;
    this._currentElement = element;
  }
  unmountComponent() {}
  getHostNode() {
    return undefined;
  }
  getPublicInstance() {
    return null;
  }
}

var ShallowComponentWrapper = function(element) {
  // TODO: Consolidate with instantiateReactComponent
  if (__DEV__) {
    this._debugID = nextDebugID++;
  }

  this.construct(element);
};
Object.assign(
  ShallowComponentWrapper.prototype,
  ReactCompositeComponent, {
    _constructComponent:
      ReactCompositeComponent._constructComponentWithoutOwner,
    _instantiateReactComponent: function(element) {
      return new NoopInternalComponent(element);
    },
    _replaceNodeWithMarkup: function() {},
  }
);

function _batchedRender(renderer, element, context) {
  var transaction = ReactUpdates.ReactReconcileTransaction.getPooled(true);
  transaction.perform(renderer._render, renderer, element, transaction, context);
  ReactUpdates.ReactReconcileTransaction.release(transaction);
}

class ReactShallowRenderer {
  _instance = null;
  getMountedInstance() {
    return this._instance ? this._instance._instance : null;
  }
  render(element, context) {
    // Ensure we've done the default injections. This might not be true in the
    // case of a simple test that only requires React and the TestUtils in
    // conjunction with an inline-requires transform.
    ReactDefaultInjection.inject();

    invariant(
      React.isValidElement(element),
      'ReactShallowRenderer render(): Invalid component element.%s',
      typeof element === 'function' ?
        ' Instead of passing a component class, make sure to instantiate ' +
        'it by passing it to React.createElement.' :
        ''
    );
    invariant(
      typeof element.type !== 'string',
      'ReactShallowRenderer render(): Shallow rendering works only with custom ' +
      'components, not primitives (%s). Instead of calling `.render(el)` and ' +
      'inspecting the rendered output, look at `el.props` directly instead.',
      element.type
    );

    if (!context) {
      context = emptyObject;
    }
    ReactUpdates.batchedUpdates(_batchedRender, this, element, context);

    return this.getRenderOutput();
  }
  getRenderOutput() {
    const renderedElement = (
      this._instance && this._instance._renderedComponent &&
      this._instance._renderedComponent._renderedOutput
    );
    return renderedElement ? this._getShallowElement(renderedElement) : null;
  }
  _getShallowElement(element) {
    if (typeof element !== 'object') {
      return element;
    }
    return Object.keys(element).reduce((current, key) => {
      if (key === 'props') {
        return Object.assign(current, {
          props: Object.keys(element.props).reduce((props, propKey) => {
            if (propKey === 'children') {
              return Object.assign(props, {
                [propKey]: Array.isArray(element.props.children)
                  ? element.props.children.map(c => this._getShallowElement(c))
                  : this._getShallowElement(element.props.children),
              });
            } else {
              return this._getShallowElementProps(props, propKey, element.props[propKey]);
            }
          }, {}),
        });
      }
      return this._getShallowElementProps(current, key, element[key]);
    }, {});
  }
  _getShallowElementProps(element, prop, value) {
    return Object.assign(element, {
      [prop]: prop === '_owner' ? null : value,
    });
  }
  unmount() {
    if (this._instance) {
      ReactReconciler.unmountComponent(this._instance, false);
    }
  }
  _render(element, transaction, context) {
    if (this._instance) {
      ReactReconciler.receiveComponent(
        this._instance,
        element,
        transaction,
        context
      );
    } else {
      var instance = new ShallowComponentWrapper(element);
      ReactReconciler.mountComponent(instance, transaction, null, null, context, 0);
      this._instance = instance;
    }
  }
}

module.exports = ReactShallowRenderer;
