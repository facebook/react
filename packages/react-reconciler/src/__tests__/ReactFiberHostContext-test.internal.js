/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let act;
let ReactFiberReconciler;
let ConcurrentRoot;
let DefaultEventPriority;

describe('ReactFiberHostContext', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    act = React.unstable_act;
    ReactFiberReconciler = require('react-reconciler');
    ConcurrentRoot =
      require('react-reconciler/src/ReactRootTags').ConcurrentRoot;
    DefaultEventPriority =
      require('react-reconciler/src/ReactEventPriorities').DefaultEventPriority;
  });

  global.IS_REACT_ACT_ENVIRONMENT = true;

  // @gate __DEV__
  it('should send the context to prepareForCommit and resetAfterCommit', () => {
    const rootContext = {};
    const childContext = {};
    const Renderer = ReactFiberReconciler({
      prepareForCommit: function (hostContext) {
        expect(hostContext).toBe(rootContext);
        return null;
      },
      resetAfterCommit: function (hostContext) {
        expect(hostContext).toBe(rootContext);
      },
      getRootHostContext: function () {
        return rootContext;
      },
      getChildHostContext: function () {
        return childContext;
      },
      shouldSetTextContent: function () {
        return false;
      },
      createInstance: function () {
        return null;
      },
      finalizeInitialChildren: function () {
        return null;
      },
      appendInitialChild: function () {
        return null;
      },
      now: function () {
        return 0;
      },
      appendChildToContainer: function () {
        return null;
      },
      clearContainer: function () {},
      getCurrentEventPriority: function () {
        return DefaultEventPriority;
      },
      requestPostPaintCallback: function () {},
      maySuspendCommit(type, props) {
        return false;
      },
      preloadInstance(type, props) {
        return true;
      },
      startSuspendingCommit() {},
      suspendInstance(type, props) {},
      waitForCommitToBeReady() {
        return null;
      },
      prepareRendererToRender: function () {},
      resetRendererAfterRender: function () {},
      supportsMutation: true,
    });

    const container = Renderer.createContainer(
      rootContext,
      ConcurrentRoot,
      null,
      false,
      '',
      null,
    );
    act(() => {
      Renderer.updateContainer(
        <a>
          <b />
        </a>,
        container,
        /* parentComponent: */ null,
        /* callback: */ null,
      );
    });
  });
});
