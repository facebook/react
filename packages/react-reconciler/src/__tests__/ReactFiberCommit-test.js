/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactFiberReconciler;

describe('ReactFiberHostContext', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactFiberReconciler = require('react-reconciler');
  });

  it('should take the data returned by prepareForCommit and send them back to resetAfterCommit', () => {
    let savedCommitData;
    const Renderer = ReactFiberReconciler({
      prepareForCommit: function(hostContext) {
        return (savedCommitData = {});
      },
      resetAfterCommit: function(hostContext, commitData) {
        expect(commitData).toBe(savedCommitData);
      },
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
        return null;
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
      mutation: {
        appendChildToContainer: function() {
          return null;
        },
      },
    });

    const container = Renderer.createContainer(/* root: */ null);
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
