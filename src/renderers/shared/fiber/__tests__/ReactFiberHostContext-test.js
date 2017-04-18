/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactFiberReconciler;

describe('ReactFiberHostContext', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('React');
    ReactFiberReconciler = require('ReactFiberReconciler');
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
      appendChild: function() {
        return null;
      },
      useSyncScheduling: true,
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
