/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactNoop;
let act;

describe('ReactFiberRefs', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    act = require('jest-react').act;
  });

  test('strings refs can be codemodded to callback refs', async () => {
    let app;
    class App extends React.Component {
      render() {
        app = this;
        return (
          <div
            prop="Hello!"
            ref={el => {
              // `refs` used to be a shared frozen object unless/until a string
              // ref attached by the reconciler, but it's not anymore so that we
              // can codemod string refs to userspace callback refs.
              this.refs.div = el;
            }}
          />
        );
      }
    }

    const root = ReactNoop.createRoot();
    await act(async () => root.render(<App />));
    expect(app.refs.div.prop).toBe('Hello!');
  });

  test('class refs are initialized to a frozen shared object', async () => {
    const refsCollection = new Set();
    class Component extends React.Component {
      constructor(props) {
        super(props);
        refsCollection.add(this.refs);
      }
      render() {
        return <div />;
      }
    }

    const root = ReactNoop.createRoot();
    await act(() =>
      root.render(
        <>
          <Component />
          <Component />
        </>,
      ),
    );

    expect(refsCollection.size).toBe(1);
    const refsInstance = Array.from(refsCollection)[0];
    expect(Object.isFrozen(refsInstance)).toBe(__DEV__);
  });
});
