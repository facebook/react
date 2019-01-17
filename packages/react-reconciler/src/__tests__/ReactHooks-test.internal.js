/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

/* eslint-disable no-func-assign */

'use strict';

let React;
let ReactFeatureFlags;
let ReactTestRenderer;
let ReactDOMServer;

// Additional tests can be found in ReactHooksWithNoopRenderer. Plan is to
// gradually migrate those to this file.
describe('ReactHooks', () => {
  beforeEach(() => {
    jest.resetModules();

    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.enableHooks = true;
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    ReactDOMServer = require('react-dom/server');
  });

  it('warns about variable number of dependencies', () => {
    const {useLayoutEffect} = React;
    function App(props) {
      useLayoutEffect(() => {
        ReactTestRenderer.unstable_yield(
          'Did commit: ' + props.dependencies.join(', '),
        );
      }, props.dependencies);
      return props.dependencies;
    }
    const root = ReactTestRenderer.create(<App dependencies={['A']} />);
    expect(ReactTestRenderer).toHaveYielded(['Did commit: A']);
    expect(() => {
      root.update(<App dependencies={['A', 'B']} />);
    }).toWarnDev([
      'Warning: Detected a variable number of hook dependencies. The length ' +
        'of the dependencies array should be constant between renders.\n\n' +
        'Previous: A, B\n' +
        'Incoming: A',
    ]);
    expect(ReactTestRenderer).toHaveYielded(['Did commit: A, B']);
  });

  it('warns for bad useEffect return values', () => {
    const {useLayoutEffect} = React;
    function App(props) {
      useLayoutEffect(() => {
        return props.return;
      });
      return null;
    }
    let root;

    expect(() => {
      root = ReactTestRenderer.create(<App return={17} />);
    }).toWarnDev([
      'Warning: useEffect function must return a cleanup function or ' +
        'nothing.\n' +
        '    in App (at **)',
    ]);

    expect(() => {
      root.update(<App return={Promise.resolve()} />);
    }).toWarnDev([
      'Warning: useEffect function must return a cleanup function or nothing.\n\n' +
        'It looks like you wrote useEffect(async () => ...) or returned a Promise.',
    ]);
  });

  // https://github.com/facebook/react/issues/14022
  it('works with ReactDOMServer calls inside a component', () => {
    const {useState} = React;
    function App(props) {
      const markup1 = ReactDOMServer.renderToString(<p>hello</p>);
      const markup2 = ReactDOMServer.renderToStaticMarkup(<p>bye</p>);
      const [counter] = useState(0);
      return markup1 + counter + markup2;
    }
    const root = ReactTestRenderer.create(<App />);
    expect(root.toJSON()).toMatchSnapshot();
  });

  it("throws when calling hooks inside .memo's compare function", () => {
    const {useState} = React;
    function App() {
      useState(0);
      return null;
    }
    const MemoApp = React.memo(App, () => {
      useState(0);
      return false;
    });

    const root = ReactTestRenderer.create(<MemoApp />);
    // trying to render again should trigger comparison and throw
    expect(() => root.update(<MemoApp />)).toThrow(
      'Hooks can only be called inside the body of a function component',
    );
    // the next round, it does a fresh mount, so should render
    expect(() => root.update(<MemoApp />)).not.toThrow(
      'Hooks can only be called inside the body of a function component',
    );
    // and then again, fail
    expect(() => root.update(<MemoApp />)).toThrow(
      'Hooks can only be called inside the body of a function component',
    );
  });

  it('throws when calling hooks inside useMemo', () => {
    const {useMemo, useState} = React;
    function App() {
      useMemo(() => {
        useState(0);
        return 1;
      });
      return null;
    }

    function Simple() {
      const [value] = useState(123);
      return value;
    }
    let root = ReactTestRenderer.create(null);
    expect(() => root.update(<App />)).toThrow(
      'Hooks can only be called inside the body of a function component',
    );

    // we want to assure that no hook machinery has broken
    // so we render a fresh component with a hook just to be sure
    root.update(<Simple />);
    expect(root.toJSON()).toEqual('123');
  });

  it('throws when calling hooks inside useReducer', () => {
    const {useReducer, useRef} = React;
    function App() {
      const [value, dispatch] = useReducer((state, action) => {
        useRef(0);
        return state;
      }, 0);
      dispatch('foo');
      return value;
    }
    expect(() => ReactTestRenderer.create(<App />)).toThrow(
      'Hooks can only be called inside the body of a function component',
    );
  });

  it("throws when calling hooks inside useState's initialize function", () => {
    const {useState, useRef} = React;
    function App() {
      useState(() => {
        useRef(0);
        return 0;
      });
    }
    expect(() => ReactTestRenderer.create(<App />)).toThrow(
      'Hooks can only be called inside the body of a function component',
    );
  });
});
