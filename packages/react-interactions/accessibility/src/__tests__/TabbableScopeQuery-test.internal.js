/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

let React;
let ReactFeatureFlags;
let tabbableScopeQuery;

describe('TabbableScopeQuery', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.enableScopeAPI = true;
    tabbableScopeQuery = require('../TabbableScopeQuery').default;
    React = require('react');
  });

  describe('ReactDOM', () => {
    let ReactDOM;
    let container;

    beforeEach(() => {
      ReactDOM = require('react-dom');
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
      container = null;
    });

    it('queryAllNodes() works as intended', () => {
      const scopeRef = React.createRef();
      const nodeRefA = React.createRef();
      const nodeRefB = React.createRef();
      const nodeRefC = React.createRef();
      const nodeRefD = React.createRef();

      const TestScope = React.unstable_createScope();

      function Test() {
        return (
          <TestScope ref={scopeRef}>
            <input ref={nodeRefA} />
            <textarea ref={nodeRefB} />
            <div tabIndex={0} ref={nodeRefC}>
              <input tabIndex={-1} />
              <div tabIndex={0} ref={nodeRefD} />
            </div>
            <input disabled={true} />
            <div tabIndex={-1} />
          </TestScope>
        );
      }

      ReactDOM.render(<Test />, container);
      let nodes = scopeRef.current.queryAllNodes(tabbableScopeQuery);
      expect(nodes).toEqual([
        nodeRefA.current,
        nodeRefB.current,
        nodeRefC.current,
        nodeRefD.current,
      ]);
      expect(nodes.length).toBe(4);
      ReactDOM.render(null, container);
      expect(scopeRef.current).toBe(null);
    });
  });
});
