/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactFiberReconciler;

describe('ReactFiberHostContext', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactFiberReconciler = require('react-reconciler');
  });

  it('works with null host context', () => {
    var creates = 0;
    var Renderer = ReactFiberReconciler({
      prepareForCommit: function() {},
      resetAfterCommit: function() {},
      getRootHostContext: function() {
        return null;
      },
      getChildHostContext: function() {
        return null;
      },
      shouldSetTextContent: function() {
        return false;
      },
      createInstance: function() {
        creates++;
      },
      finalizeInitialChildren: function() {
        return null;
      },
      appendInitialChild: function() {
        return null;
      },
      now: function() {
        return 0;
      },
      useSyncScheduling: true,
      mutation: {
        appendChildToContainer: function() {
          return null;
        },
      },
    });

    const container = Renderer.createContainer(/* root: */ null);
    Renderer.updateContainer(
      <a><b /></a>,
      container,
      /* parentComponent: */ null,
      /* callback: */ null,
    );
    expect(creates).toBe(2);
  });
});
