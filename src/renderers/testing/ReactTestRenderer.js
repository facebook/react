/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactTestRenderer
 * @flow
 */

'use strict';

var ReactComponentEnvironment = require('ReactComponentEnvironment');
var ReactDefaultBatchingStrategy = require('ReactDefaultBatchingStrategy');
var ReactEmptyComponent = require('ReactEmptyComponent');
var ReactMultiChild = require('ReactMultiChild');
var ReactHostComponent = require('ReactHostComponent');
var ReactTestMount = require('ReactTestMount');
var ReactTestReconcileTransaction = require('ReactTestReconcileTransaction');
var ReactUpdates = require('ReactUpdates');
var ReactTestTextComponent = require('ReactTestTextComponent');
var ReactTestEmptyComponent = require('ReactTestEmptyComponent');
var invariant = require('invariant');

import type { ReactElement } from 'ReactElementType';
import type { ReactInstance } from 'ReactInstanceType';

type ReactTestRendererJSON = {
  type: string,
  props: { [propName: string]: string },
  children: null | Array<string | ReactTestRendererJSON>,
  $$typeof?: any
}

/**
 * Drill down (through composites and empty components) until we get a native or
 * native text component.
 *
 * This is pretty polymorphic but unavoidable with the current structure we have
 * for `_renderedChildren`.
 */
function getRenderedHostOrTextFromComponent(component) {
  var rendered;
  while ((rendered = component._renderedComponent)) {
    component = rendered;
  }
  return component;
}

class ReactTestComponent {
  _currentElement: ReactElement;
  _renderedChildren: null | Object;
  _topLevelWrapper: null | ReactInstance;
  _hostContainerInfo: null | Object;

  constructor(element: ReactElement) {
    this._currentElement = element;
    this._renderedChildren = null;
    this._topLevelWrapper = null;
    this._hostContainerInfo = null;
  }

  mountComponent(
    transaction: ReactTestReconcileTransaction,
    nativeParent: null | ReactTestComponent,
    hostContainerInfo: Object,
    context: Object,
  ) {
    var element = this._currentElement;
    this._hostContainerInfo = hostContainerInfo;
    // $FlowFixMe https://github.com/facebook/flow/issues/1805
    this.mountChildren(element.props.children, transaction, context);
  }

  receiveComponent(
    nextElement: ReactElement,
    transaction: ReactTestReconcileTransaction,
    context: Object,
  ) {
    this._currentElement = nextElement;
    // $FlowFixMe https://github.com/facebook/flow/issues/1805
    this.updateChildren(nextElement.props.children, transaction, context);
  }

  getPublicInstance(): Object {
    var element = this._currentElement;
    var hostContainerInfo = this._hostContainerInfo;
    invariant(
      hostContainerInfo,
      'hostContainerInfo should be populated before ' +
      'getPublicInstance is called.'
    );
    return hostContainerInfo.createNodeMock(element);
  }

  toJSON(): ReactTestRendererJSON {
    // not using `children`, but I don't want to rewrite without destructuring
    // eslint-disable-next-line no-unused-vars
    var {children, ...props} = this._currentElement.props;
    var childrenJSON = [];
    for (var key in this._renderedChildren) {
      var inst = this._renderedChildren[key];
      inst = getRenderedHostOrTextFromComponent(inst);
      var json = inst.toJSON();
      if (json !== undefined) {
        childrenJSON.push(json);
      }
    }
    var object: ReactTestRendererJSON = {
      type: this._currentElement.type,
      props: props,
      children: childrenJSON.length ? childrenJSON : null,
    };
    Object.defineProperty(object, '$$typeof', {
      value: Symbol.for('react.test.json'),
    });
    return object;
  }

  getHostNode(): void {}
  unmountComponent(): void {}
}

Object.assign(ReactTestComponent.prototype, ReactMultiChild.Mixin);

// =============================================================================

ReactUpdates.injection.injectReconcileTransaction(
  ReactTestReconcileTransaction
);
ReactUpdates.injection.injectBatchingStrategy(ReactDefaultBatchingStrategy);

ReactHostComponent.injection.injectGenericComponentClass(ReactTestComponent);
ReactHostComponent.injection.injectTextComponentClass(ReactTestTextComponent);
ReactEmptyComponent.injection.injectEmptyComponentFactory(function() {
  return new ReactTestEmptyComponent();
});

ReactComponentEnvironment.injection.injectEnvironment({
  processChildrenUpdates: function() {},
  replaceNodeWithMarkup: function() {},
});

var ReactTestRenderer = {
  create: ReactTestMount.render,
  /* eslint-disable camelcase */
  unstable_batchedUpdates: ReactUpdates.batchedUpdates,
  /* eslint-enable camelcase */
};

module.exports = ReactTestRenderer;
