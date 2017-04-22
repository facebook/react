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

var alreadyInjected = false;

function inject() {
  if (alreadyInjected) {
    // TODO: This is currently true because these injections are shared between
    // the client and the server package. They should be built independently
    // and not share any injection state. Then this problem will be solved.
    return;
  }
  alreadyInjected = true;

  ReactGenericBatching.injection.injectStackBatchedUpdates(
    ReactUpdates.batchedUpdates,
  );

  ReactHostComponent.injection.injectGenericComponentClass(ReactDOMComponent);

  ReactHostComponent.injection.injectTextComponentClass(ReactDOMTextComponent);

  ReactEmptyComponent.injection.injectEmptyComponentFactory(
    function(instantiate) {
      return new ReactDOMEmptyComponent(instantiate);
    },
  );

  ReactUpdates.injection.injectReconcileTransaction(ReactReconcileTransaction);
  ReactUpdates.injection.injectBatchingStrategy(ReactDefaultBatchingStrategy);

  ReactComponentEnvironment.injection.injectEnvironment(
    ReactComponentBrowserEnvironment,
  );

  findDOMNode._injectStack(function(inst) {
    inst = getHostComponentFromComposite(inst);
    return inst ? ReactDOMComponentTree.getNodeFromInstance(inst) : null;
  });
}

module.exports = {
  inject: inject,
};
