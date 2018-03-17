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

  it('works with null host context', () => {
    let creates = 0;
    const Renderer = ReactFiberReconciler({
      prepareForCommit: () => {},
      resetAfterCommit: () => {},
      getRootHostContext: () => null,
      getChildHostContext: () => null,
      shouldSetTextContent: () => false,
      createInstance: () => creates++,
      finalizeInitialChildren: () => null,
      appendInitialChild: () => null,
      now: () => 0,
      mutation: {
        appendChildToContainer: () => null,
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
    expect(creates).toBe(2);
  });

  it('should send the context to prepareForCommit and resetAfterCommit', () => {
    let rootContext = {};
    const Renderer = ReactFiberReconciler({
      prepareForCommit: (hostContext) => expect(hostContext).toBe(rootContext),
      resetAfterCommit: (hostContext) => expect(hostContext).toBe(rootContext),
      getRootHostContext: () => null,
      getChildHostContext: () => null,
      shouldSetTextContent: () => false,
      createInstance: () => null,
      finalizeInitialChildren: () => null,
      appendInitialChild: () => null,
      now: () => 0,
      mutation: {
        appendChildToContainer: () => null,
      },
    });

    const container = Renderer.createContainer(rootContext);
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
