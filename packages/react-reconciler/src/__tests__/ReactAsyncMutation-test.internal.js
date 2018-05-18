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
let ReactFeatureFlags;
let ReactNoop;

describe('ReactAsyncMutation', () => {
  beforeEach(() => {
    jest.resetModuleRegistry();
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    ReactFeatureFlags.enableSuspense = true;
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  function span(prop) {
    return {type: 'span', children: [], prop};
  }

  it('can read mutable state without tearing', () => {
    const store = {
      value: {
        theme: 'light',
      },
    };

    const subscriptions = new Set();

    function subscribe(handler) {
      subscriptions.add(handler);
      return () => {
        subscriptions.delete(handler);
      };
    }

    function emitChange() {
      ReactNoop.yield('[change emitted!]');
      subscriptions.forEach(handler => {
        handler();
      });
    }

    function readStoreValue() {
      ReactNoop.yield('[accessed mutable state!]');
      ReactNoop.willAccessMutableState();
      return store.value;
    }

    class Subscription extends React.Component {
      constructor(props) {
        super();
        this.state = {value: readStoreValue()};
        // If this weren't a test, we'd need to clean this subscription up.
        subscribe(() => {
          this.setState({value: readStoreValue()});
        });
      }
      render() {
        return this.props.children(this.state.value);
      }
    }

    class ThemedText extends React.PureComponent {
      render() {
        return (
          <Subscription>
            {value => {
              const msg = `${this.props.text} [theme: ${value.theme}]`;
              ReactNoop.yield(msg);
              return <span prop={msg} />;
            }}
          </Subscription>
        );
      }
    }

    function App(props) {
      ReactNoop.yield('App');
      return (
        <React.Fragment>
          <ThemedText text="A" />
          <ThemedText text="B" />
          {props.showMore ? <ThemedText text="C" /> : null}
        </React.Fragment>
      );
    }

    // Initial mount
    ReactNoop.render(<App showMore={false} />);
    expect(ReactNoop.flush()).toEqual([
      'App',
      '[accessed mutable state!]',
      'A [theme: light]',
      '[accessed mutable state!]',
      'B [theme: light]',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('A [theme: light]'),
      span('B [theme: light]'),
    ]);

    // The theme is read from a mutable store. Mutate the store and emit a
    // change event.
    store.value.theme = 'dark';
    emitChange();
    expect(ReactNoop.flush()).toEqual([
      '[change emitted!]',
      '[accessed mutable state!]',
      '[accessed mutable state!]',
      'A [theme: dark]',
      'B [theme: dark]',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('A [theme: dark]'),
      span('B [theme: dark]'),
    ]);

    // Change the theme again, but this time, interrupt the update midway
    // through with a high priority update
    store.value.theme = 'light';
    emitChange();
    ReactNoop.flushThrough([
      '[change emitted!]',
      '[accessed mutable state!]',
      '[accessed mutable state!]',
      'A [theme: light]',
      // Yield after the first child
    ]);

    // Interrupt with an update the shows an additional child
    ReactNoop.flushSync(() => {
      ReactNoop.render(<App showMore={true} />);
    });
    expect(ReactNoop.clearYields()).toEqual([
      'App',
      // Inside the constructor of the new child, we attempt to access the store
      '[accessed mutable state!]',
      // but because the store has pending mutation updates, React suspends the
      // the current render
    ]);
    // The children haven't been updated yet.
    // TODO: We've effectively de-prioritized the high priority work. It might make
    // more sense to increase the priority of the low priority work.
    expect(ReactNoop.getChildren()).toEqual([
      span('A [theme: dark]'),
      span('B [theme: dark]'),
    ]);

    // Now flush the remaining work
    expect(ReactNoop.flush()).toEqual([
      'App',
      'A [theme: light]',
      'B [theme: light]',
      '[accessed mutable state!]',
      'C [theme: light]',
    ]);
    // All the children update in a single, consistent render.
    expect(ReactNoop.getChildren()).toEqual([
      span('A [theme: light]'),
      span('B [theme: light]'),
      span('C [theme: light]'),
    ]);
  });
});
