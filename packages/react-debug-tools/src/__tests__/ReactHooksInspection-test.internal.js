/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactDebugTools;

describe('ReactHooksInspection', () => {
  beforeEach(() => {
    jest.resetModules();
    const ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableFlareAPI = true;
    React = require('react');
    ReactDebugTools = require('react-debug-tools');
  });

  it('should inspect a simple useResponder hook', () => {
    const TestResponder = React.unstable_createResponder('TestResponder', {});

    function Foo(props) {
      const listener = React.unstable_useResponder(TestResponder, {
        preventDefault: false,
      });
      return <div listeners={listener}>Hello world</div>;
    }
    let tree = ReactDebugTools.inspectHooks(Foo, {});
    expect(tree).toEqual([
      {
        isStateEditable: false,
        id: 0,
        name: 'Responder',
        value: {props: {preventDefault: false}, responder: 'TestResponder'},
        subHooks: [],
      },
    ]);
  });
});
