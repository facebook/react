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
var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactDefaultBatchingStrategy = require('ReactDefaultBatchingStrategy');
var ReactReconciler = require('ReactReconciler');
var ReactReconcileTransaction = require('ReactReconcileTransaction');
var ReactUpdates = require('ReactUpdates');

var emptyObject = require('emptyObject');
var getNextDebugID = require('getNextDebugID');
var invariant = require('invariant');

function injectDefaults() {
  ReactUpdates.injection.injectReconcileTransaction(
    ReactReconcileTransaction
  );
  ReactUpdates.injection.injectBatchingStrategy(
    ReactDefaultBatchingStrategy
  );
}

class NoopInternalComponent {
  constructor(element) {
    this._renderedOutput = element;
    this._currentElement = element;

    if (__DEV__) {
      this._debugID = getNextDebugID();
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
    this._debugID = getNextDebugID();
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
    _renderValidatedComponent:
      ReactCompositeComponent
        ._renderValidatedComponentWithoutOwnerOrContext,
  }
);

function _batchedRender(renderer, element, context) {
  var transaction = ReactUpdates.ReactReconcileTransaction.getPooled(true);
  renderer._render(element, transaction, context);
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
    injectDefaults();

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
    return (
      (this._instance && this._instance._renderedComponent &&
      this._instance._renderedComponent._renderedOutput)
      || null
    );
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

ReactShallowRenderer.createRenderer = function() {
  return new ReactShallowRenderer();
};

module.exports = ReactShallowRenderer;
