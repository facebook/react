/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMStackInjection
 */

'use strict';

var ReactComponentEnvironment = require('ReactComponentEnvironment');
var ReactComponentBrowserEnvironment = require('ReactComponentBrowserEnvironment');
var ReactDOMComponent = require('ReactDOMComponent');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactDOMEmptyComponent = require('ReactDOMEmptyComponent');
var ReactDOMTextComponent = require('ReactDOMTextComponent');
var ReactDefaultBatchingStrategy = require('ReactDefaultBatchingStrategy');
var ReactEmptyComponent = require('ReactEmptyComponent');
var ReactGenericBatching = require('ReactGenericBatching');
var ReactHostComponent = require('ReactHostComponent');
var ReactReconcileTransaction = require('ReactReconcileTransaction');
var ReactUpdates = require('ReactUpdates');

var findDOMNode = require('findDOMNode');
var getHostComponentFromComposite = require('getHostComponentFromComposite');

ReactGenericBatching.injection.injectStackBatchedUpdates(
  ReactUpdates.batchedUpdates,
);

ReactHostComponent.injection.injectGenericComponentClass(ReactDOMComponent);

ReactHostComponent.injection.injectTextComponentClass(ReactDOMTextComponent);

ReactEmptyComponent.injection.injectEmptyComponentFactory(function(
  instantiate,
) {
  return new ReactDOMEmptyComponent(instantiate);
});

ReactUpdates.injection.injectReconcileTransaction(ReactReconcileTransaction);
ReactUpdates.injection.injectBatchingStrategy(ReactDefaultBatchingStrategy);

ReactComponentEnvironment.injection.injectEnvironment(
  ReactComponentBrowserEnvironment,
);

findDOMNode._injectStack(function(inst) {
  inst = getHostComponentFromComposite(inst);
  return inst ? ReactDOMComponentTree.getNodeFromInstance(inst) : null;
});
