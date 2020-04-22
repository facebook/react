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
    ReactFeatureFlags.enableDeprecatedFlareAPI = true;
    React = require('react');
    ReactDebugTools = require('react-debug-tools');
  });

  // @gate experimental
  it('should inspect a simple useResponder hook', () => {
    const TestResponder = React.DEPRECATED_createResponder('TestResponder', {});

    function Foo(props) {
      const listener = React.DEPRECATED_useResponder(TestResponder, {
        preventDefault: false,
      });
      return <div DEPRECATED_flareListeners={listener}>Hello world</div>;
    }
    const tree = ReactDebugTools.inspectHooks(Foo, {});
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
