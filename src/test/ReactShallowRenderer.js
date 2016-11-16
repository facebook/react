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

var React = require('React');
var ReactDOMInjection = require('ReactDOMInjection');
var ReactDOMStackInjection = require('ReactDOMStackInjection');
var ReactCompositeComponent = require('ReactCompositeComponent');
var ReactReconciler = require('ReactReconciler');
var ReactUpdates = require('ReactUpdates');

var emptyObject = require('emptyObject');
var getNextDebugID = require('getNextDebugID');
var invariant = require('invariant');

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

const clearShallowRefs = (shallowWrapper) => {
  shallowWrapper._instance.refs = {};

  shallowWrapper._attachedCallbackRefs.map((cb) => cb(null));
  shallowWrapper._attachedCallbackRefs = [];
};


const dealWithShallowRefs = (element, shallowWrapper) => {
  if (!React.isValidElement(element)) {
    return;
  }

  attachShallowRef(element, shallowWrapper);

  const children = element.props.children;
  if (Array.isArray(element.props.children)) {
    element.props.children.map((child) => {
      dealWithShallowRefs(child, shallowWrapper);
    });
  } else {
    const child = children;
    dealWithShallowRefs(child, shallowWrapper);
  }
};

const attachShallowRef = (element, shallowWrapper) => {
  const componentInstance = shallowWrapper._instance;

  switch (typeof element.ref) {
    case 'function':
      shallowWrapper._attachedCallbackRefs.push(element.ref);
      element.ref(element);
      break;
    case 'string':
      if (componentInstance.refs[element.ref]) {
        throw new Error('The component has 2 string-refs with the same name: ' + element.ref);
      }

      componentInstance.refs = {
        ...componentInstance.refs,
        [element.ref]: element,
      };
      break;
  }
};


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
    _constructComponent: ReactCompositeComponent._constructComponentWithoutOwner,
    _instantiateReactComponent: function(element) {
      return new NoopInternalComponent(element);
    },
    _replaceNodeWithMarkup: function() {},
    _renderValidatedComponent: ReactCompositeComponent ._renderValidatedComponentWithoutOwnerOrContext,
    _attachedCallbackRefs: [],

    _updateRenderedComponentWithNextElement: function(...args) {
      ReactCompositeComponent._updateRenderedComponentWithNextElement.bind(this)(
        ...args,
        true /* shallowRendering */
      );
    },
    performInitialMountWithErrorHandling: function(...args) {
      ReactCompositeComponent.performInitialMountWithErrorHandling.bind(this)(
        ...args,
        true /* shallowRendering */
      );
    },

    performInitialMount: function(...args) {
      ReactCompositeComponent.performInitialMount.bind(this)(
        ...args,
        true /* shallowRendering */
      );
    },

    unmountComponent: function(...args) {
      ReactCompositeComponent.unmountComponent.bind(this)(
        ...args,
        true /* shallowRendering */
      );
    },
    updateComponent: function(...args) {
      if (this._instance) {
        clearShallowRefs(this);
      }
      ReactCompositeComponent.updateComponent.bind(this)(...args);

      const currentElement = this._renderedComponent._currentElement;
      dealWithShallowRefs(currentElement, this);
    },
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
    ReactDOMInjection.inject();
    ReactDOMStackInjection.inject();

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
      ReactReconciler.unmountComponent(
        this._instance,
        false, /* safely */
        false, /* skipLifecycle */
        true /* shallowRendering */
      );
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
      ReactReconciler.mountComponent(
        instance,
        transaction,
        null,
        null,
        context,
        0,
        true /* shallowRendering */
      );
      this._instance = instance;
    }

    const currentElement = this._instance._renderedComponent._currentElement;
    dealWithShallowRefs(currentElement, this._instance);
  }
}

module.exports = ReactShallowRenderer;
