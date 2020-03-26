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
let ReactDOM;
let ReactDebugTools;

describe('ReactHooksInspection', () => {
  beforeEach(() => {
    jest.resetModules();
    const ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableDeprecatedFlareAPI = true;
    ReactFeatureFlags.enableUseEventAPI = true;
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDebugTools = require('react-debug-tools');
  });

  if (!__EXPERIMENTAL__) {
    it("empty test so Jest doesn't complain", () => {});
    return;
  }

  it('should inspect a simple useResponder hook', () => {
    const TestResponder = React.DEPRECATED_createResponder('TestResponder', {});

    function Foo(props) {
      const listener = React.DEPRECATED_useResponder(TestResponder, {
        preventDefault: false,
      });
      return <div DEPRECATED_flareListeners={listener}>Hello world</div>;
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

  it('should inspect a simple ReactDOM.useEvent hook', () => {
    let clickHandle;
    let ref;

    const effect = () => {
      clickHandle.setListener(ref.current, () => {});
    };

    function Foo(props) {
      ref = React.useRef(null);
      clickHandle = ReactDOM.unstable_useEvent('click');
      React.useEffect(effect);
      return <div ref={ref}>Hello world</div>;
    }
    let tree = ReactDebugTools.inspectHooks(Foo, {});
    expect(tree).toEqual([
      {
        isStateEditable: false,
        id: 0,
        name: 'Ref',
        subHooks: [],
        value: null,
      },
      {
        isStateEditable: false,
        id: 1,
        name: 'Event',
        value: {capture: false, passive: undefined, priority: 0, type: 'click'},
        subHooks: [],
      },
      {
        isStateEditable: false,
        id: 2,
        name: 'Effect',
        value: effect,
        subHooks: [],
      },
    ]);
  });
});
