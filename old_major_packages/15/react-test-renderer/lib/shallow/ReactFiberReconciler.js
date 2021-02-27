/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

'use strict';

var _require = require('./ReactFiberRoot'),
    createFiberRoot = _require.createFiberRoot;

var ReactFiberScheduler = require('./ReactFiberScheduler');

module.exports = function (config) {
  var _ReactFiberScheduler = ReactFiberScheduler(config),
      scheduleWork = _ReactFiberScheduler.scheduleWork,
      performWithPriority = _ReactFiberScheduler.performWithPriority;

  return {
    mountContainer: function (element, containerInfo) {
      var root = createFiberRoot(containerInfo);
      var container = root.current;
      // TODO: Use pending work/state instead of props.
      // TODO: This should not override the pendingWorkPriority if there is
      // higher priority work in the subtree.
      container.pendingProps = element;

      scheduleWork(root);

      // It may seem strange that we don't return the root here, but that will
      // allow us to have containers that are in the middle of the tree instead
      // of being roots.
      return container;
    },
    updateContainer: function (element, container) {
      // TODO: If this is a nested container, this won't be the root.
      var root = container.stateNode;
      // TODO: Use pending work/state instead of props.
      root.current.pendingProps = element;

      scheduleWork(root);
    },
    unmountContainer: function (container) {
      // TODO: If this is a nested container, this won't be the root.
      var root = container.stateNode;
      // TODO: Use pending work/state instead of props.
      root.current.pendingProps = [];

      scheduleWork(root);
    },


    performWithPriority: performWithPriority,

    getPublicRootInstance: function (container) {
      return null;
    }
  };
};