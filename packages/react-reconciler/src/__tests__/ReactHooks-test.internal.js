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
});
