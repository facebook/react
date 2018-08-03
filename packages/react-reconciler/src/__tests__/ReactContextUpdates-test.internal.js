/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let ReactFeatureFlags;
let React;
let ReactNoop;

describe('ReactContextUpdates', () => {
  beforeEach(() => {
    jest.resetModules();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  function Text(props) {
    ReactNoop.yield(props.text);
    return <span prop={props.text} />;
  }

  function span(prop) {
    return {type: 'span', children: [], prop};
  }

  it('simple update', () => {
    const ThemeState = React.createContext('light');

    function ThemedLabel() {
      const theme = ThemeState.unstable_read();
      return <Text text={`Theme: ${theme}`} />;
    }

    function App() {
      return (
        <React.Fragment>
          <ThemedLabel />
          <Text text="Sibling" />
          <ThemedLabel />
        </React.Fragment>
      );
    }

    ReactNoop.render(<App />);
    expect(ReactNoop.flush()).toEqual([
      'Theme: light',
      'Sibling',
      'Theme: light',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Theme: light'),
      span('Sibling'),
      span('Theme: light'),
    ]);

    ThemeState.unstable_set('dark');
    expect(ReactNoop.flush()).toEqual(['Theme: dark', 'Theme: dark']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Theme: dark'),
      span('Sibling'),
      span('Theme: dark'),
    ]);
  });

  it('updates multiple roots', () => {
    const ThemeState = React.createContext('light');

    function ThemedLabel() {
      const theme = ThemeState.unstable_read();
      return <Text text={`Theme: ${theme}`} />;
    }

    ReactNoop.renderToRootWithID(<ThemedLabel />, 'a');
    ReactNoop.renderToRootWithID(<ThemedLabel />, 'b');

    expect(ReactNoop.flush()).toEqual(['Theme: light', 'Theme: light']);
    expect(ReactNoop.getChildren('a')).toEqual([span('Theme: light')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('Theme: light')]);

    // Update the global state. Both roots should update.
    ThemeState.unstable_set('dark');
    expect(ReactNoop.flush()).toEqual(['Theme: dark', 'Theme: dark']);
    expect(ReactNoop.getChildren('a')).toEqual([span('Theme: dark')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('Theme: dark')]);
  });

  it('accepts a callback', () => {
    const ThemeState = React.createContext('light');

    function ThemedLabel() {
      const theme = ThemeState.unstable_read();
      return <Text text={`Theme: ${theme}`} />;
    }

    function App() {
      return (
        <React.Fragment>
          <Text text="Before" />
          <ThemedLabel />
          <Text text="After" />
        </React.Fragment>
      );
    }

    ReactNoop.renderToRootWithID(<App />, 'a');
    ReactNoop.renderToRootWithID(<App />, 'b');
    expect(ReactNoop.flush()).toEqual([
      // Root a
      'Before',
      'Theme: light',
      'After',
      // Root b
      'Before',
      'Theme: light',
      'After',
    ]);
    expect(ReactNoop.getChildren('a')).toEqual([
      span('Before'),
      span('Theme: light'),
      span('After'),
    ]);
    expect(ReactNoop.getChildren('b')).toEqual([
      span('Before'),
      span('Theme: light'),
      span('After'),
    ]);

    // Update the global state. Both roots should update.
    ThemeState.unstable_set('dark', () => {
      ReactNoop.yield('Did call callback');
    });

    // This will render the first root and yield right before committing.
    expect(ReactNoop.flushNextYield()).toEqual(['Theme: dark']);
    // The children haven't updated yet, and the callback was not called.
    expect(ReactNoop.getChildren('a')).toEqual([
      span('Before'),
      span('Theme: light'),
      span('After'),
    ]);
    expect(ReactNoop.getChildren('b')).toEqual([
      span('Before'),
      span('Theme: light'),
      span('After'),
    ]);

    // This will commit the first root and render the second root, but without
    // committing the second root.
    expect(ReactNoop.flushNextYield()).toEqual(['Theme: dark']);
    // The first root has updated, but not the second one. The callback still
    // hasn't been called, because it's waiting for b to commit.
    expect(ReactNoop.getChildren('a')).toEqual([
      span('Before'),
      span('Theme: dark'),
      span('After'),
    ]);
    expect(ReactNoop.getChildren('b')).toEqual([
      span('Before'),
      span('Theme: light'),
      span('After'),
    ]);

    // Now commit the second root. The callback is called.
    expect(ReactNoop.flush()).toEqual(['Did call callback']);
    expect(ReactNoop.getChildren('a')).toEqual([
      span('Before'),
      span('Theme: dark'),
      span('After'),
    ]);
    expect(ReactNoop.getChildren('b')).toEqual([
      span('Before'),
      span('Theme: dark'),
      span('After'),
    ]);
  });

  it('works across sync and async roots', () => {
    const ThemeState = React.createContext('light');

    function ThemedLabel() {
      const theme = ThemeState.unstable_read();
      return <Text text={`Theme: ${theme}`} />;
    }

    ReactNoop.renderLegacySyncRootWithID(<ThemedLabel />, 'a');
    ReactNoop.renderToRootWithID(<ThemedLabel />, 'b');

    expect(ReactNoop.flush()).toEqual(['Theme: light', 'Theme: light']);
    expect(ReactNoop.getChildren('a')).toEqual([span('Theme: light')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('Theme: light')]);

    ThemeState.unstable_set('dark', () => {
      ReactNoop.yield('Did call callback');
    });
    // Root a is synchronous, so it already updated. The callback shouldn't
    // have fired yet, though, because root b is still pending.
    expect(ReactNoop.clearYields()).toEqual(['Theme: dark']);

    // Flush the remaining work and fire the callback.
    expect(ReactNoop.flush()).toEqual(['Theme: dark', 'Did call callback']);
    expect(ReactNoop.getChildren('a')).toEqual([span('Theme: dark')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('Theme: dark')]);
  });

  it('unmounts a root that reads from global state', () => {
    const ThemeState = React.createContext('light');

    function ThemedLabel() {
      const theme = ThemeState.unstable_read();
      return <Text text={`Theme: ${theme}`} />;
    }

    ReactNoop.renderToRootWithID(<ThemedLabel />, 'a');
    ReactNoop.renderToRootWithID(<ThemedLabel />, 'b');

    expect(ReactNoop.flush()).toEqual(['Theme: light', 'Theme: light']);
    expect(ReactNoop.getChildren('a')).toEqual([span('Theme: light')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('Theme: light')]);

    // Update the global state. Both roots should update.
    ThemeState.unstable_set('dark');
    expect(ReactNoop.flush()).toEqual(['Theme: dark', 'Theme: dark']);
    expect(ReactNoop.getChildren('a')).toEqual([span('Theme: dark')]);
    expect(ReactNoop.getChildren('b')).toEqual([span('Theme: dark')]);

    // Unmount one of the roots
    ReactNoop.unmountRootWithID('a');
    expect(ReactNoop.flush()).toEqual([]);
    expect(ReactNoop.getChildren('a')).toEqual(null);
    expect(ReactNoop.getChildren('b')).toEqual([span('Theme: dark')]);

    // Update again
    ThemeState.unstable_set('blue');
    expect(ReactNoop.flush()).toEqual(['Theme: blue']);
    expect(ReactNoop.getChildren('a')).toEqual(null);
    expect(ReactNoop.getChildren('b')).toEqual([span('Theme: blue')]);
  });

  it('passes updated global state to new roots', () => {
    const ThemeState = React.createContext('light');

    function ThemedLabel() {
      const theme = ThemeState.unstable_read();
      return <Text text={`Theme: ${theme}`} />;
    }

    ReactNoop.renderToRootWithID(<ThemedLabel />, 'a');

    expect(ReactNoop.flush()).toEqual(['Theme: light']);
    expect(ReactNoop.getChildren('a')).toEqual([span('Theme: light')]);

    ThemeState.unstable_set('dark');
    expect(ReactNoop.flush()).toEqual(['Theme: dark']);
    expect(ReactNoop.getChildren('a')).toEqual([span('Theme: dark')]);

    ReactNoop.renderToRootWithID(<ThemedLabel />, 'b');
    expect(ReactNoop.flush()).toEqual(['Theme: dark']);
    expect(ReactNoop.getChildren('b')).toEqual([span('Theme: dark')]);
  });

  it('passes latest value to roots created in the middle of a context transition', () => {
    const ThemeState = React.createContext('light');

    function ThemedLabel() {
      const theme = ThemeState.unstable_read();
      return <Text text={`Theme: ${theme}`} />;
    }

    function App() {
      return (
        <React.Fragment>
          <ThemedLabel />
          <ThemedLabel />
        </React.Fragment>
      );
    }

    ReactNoop.renderToRootWithID(<App />, 'a');

    expect(ReactNoop.flush()).toEqual(['Theme: light', 'Theme: light']);
    expect(ReactNoop.getChildren('a')).toEqual([
      span('Theme: light'),
      span('Theme: light'),
    ]);

    ThemeState.unstable_set('dark');
    ReactNoop.flushThrough(['Theme: dark']);

    ReactNoop.renderLegacySyncRootWithID(<App />, 'b');
    expect(ReactNoop.clearYields()).toEqual(['Theme: dark', 'Theme: dark']);
    expect(ReactNoop.getChildren('b')).toEqual([
      span('Theme: dark'),
      span('Theme: dark'),
    ]);

    expect(ReactNoop.flush()).toEqual(['Theme: dark', 'Theme: dark']);
    expect(ReactNoop.getChildren('a')).toEqual([
      span('Theme: dark'),
      span('Theme: dark'),
    ]);
  });

  it('supports nested providers', () => {
    const ThemeState = React.createContext('light');

    function ThemedLabel() {
      const theme = ThemeState.unstable_read();
      return <Text text={`Theme: ${theme}`} />;
    }

    function App() {
      return (
        <React.Fragment>
          <ThemedLabel />
          <ThemeState.Provider value="blue">
            <ThemedLabel />
          </ThemeState.Provider>
        </React.Fragment>
      );
    }

    ReactNoop.render(<App />);
    expect(ReactNoop.flush()).toEqual(['Theme: light', 'Theme: blue']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Theme: light'),
      span('Theme: blue'),
    ]);

    ThemeState.unstable_set('dark');
    expect(ReactNoop.flush()).toEqual(['Theme: dark']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Theme: dark'),
      span('Theme: blue'),
    ]);
  });

  it('calls callback immediately if there are no consumers', () => {
    const ThemeState = React.createContext('light');
    ThemeState.unstable_set('dark', () => {
      ReactNoop.yield('Did call callback');
    });
    expect(ReactNoop.clearYields()).toEqual(['Did call callback']);
  });

  it('queues updates at multiple priority levels', () => {
    const ThemeState = React.createContext('light');

    function ThemedLabel() {
      const theme = ThemeState.unstable_read();
      return <Text text={`Theme: ${theme}`} />;
    }

    ReactNoop.render(<ThemedLabel />);
    expect(ReactNoop.flush()).toEqual(['Theme: light']);
    expect(ReactNoop.getChildren()).toEqual([span('Theme: light')]);

    ThemeState.unstable_set('dark');
    ReactNoop.flushSync(() => {
      ThemeState.unstable_set('blue');
    });
    expect(ReactNoop.clearYields()).toEqual(['Theme: blue']);
    expect(ReactNoop.getChildren()).toEqual([span('Theme: blue')]);

    expect(ReactNoop.flush()).toEqual(['Theme: blue']);
    expect(ReactNoop.getChildren()).toEqual([span('Theme: blue')]);
  });

  it('interrupts a low priority context update', () => {
    const ThemeState = React.createContext('light');

    function ThemedLabel() {
      const theme = ThemeState.unstable_read();
      return <Text text={`Theme: ${theme}`} />;
    }

    class Stateful extends React.Component {
      state = {step: 1};
      render() {
        const theme = ThemeState.unstable_read();
        return <Text text={`Step ${this.state.step} (${theme})`} />;
      }
    }

    const stateful = React.createRef(null);
    ReactNoop.render(
      <React.Fragment>
        <Stateful ref={stateful} />
        <ThemedLabel />
      </React.Fragment>,
    );

    expect(ReactNoop.flush()).toEqual(['Step 1 (light)', 'Theme: light']);

    ThemeState.unstable_set('dark');
    ReactNoop.flushThrough(['Step 1 (dark)']);

    ReactNoop.flushSync(() => {
      stateful.current.setState({step: 2});
    });
    expect(ReactNoop.clearYields()).toEqual(['Step 2 (light)']);

    expect(ReactNoop.flush()).toEqual(['Step 2 (dark)', 'Theme: dark']);
  });
});
