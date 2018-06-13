/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 */

'use strict';

let React;
let ReactNoop;

describe('ReactExpiration', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  function span(prop) {
    return {type: 'span', children: [], prop};
  }

  function Text(props) {
    ReactNoop.yield(props.text);
    return <span prop={props.text} />;
  }

  it('increases priority of updates as time progresses', () => {
    ReactNoop.render(<span prop="done" />);

    expect(ReactNoop.getChildren()).toEqual([]);

    // Nothing has expired yet because time hasn't advanced.
    ReactNoop.flushExpired();
    expect(ReactNoop.getChildren()).toEqual([]);

    // Advance time a bit, but not enough to expire the low pri update.
    ReactNoop.expire(4500);
    ReactNoop.flushExpired();
    expect(ReactNoop.getChildren()).toEqual([]);

    // Advance by another second. Now the update should expire and flush.
    ReactNoop.expire(1000);
    ReactNoop.flushExpired();
    expect(ReactNoop.getChildren()).toEqual([span('done')]);
  });

  it('batches two async updates and flushes at the same time', () => {
    class App extends React.Component {
      componentDidMount() {
        ReactNoop.yield('componentDidMount');
      }

      componentDidUpdate() {
        ReactNoop.yield('componentDidUpdate');
      }

      render() {
        return this.props.children;
      }
    }

    ReactNoop.render(
      <App>
        <Text text="One" />
      </App>,
    );
    ReactNoop.expire(1000);
    ReactNoop.render(
      <App>
        <Text text="Two" />
      </App>,
    );
    expect(ReactNoop.flush()).toEqual(['Two', 'componentDidMount']);
  });

  it('batches an async and a sync update and flushes at the same time', () => {
    class App extends React.Component {
      componentDidMount() {
        ReactNoop.yield('componentDidMount');
      }

      componentDidUpdate() {
        ReactNoop.yield('componentDidUpdate');
      }

      render() {
        return this.props.children;
      }
    }
    ReactNoop.render(
      <App>
        <Text text="One" />
      </App>,
    );
    ReactNoop.expire(5000);
    ReactNoop.flushSync(() => {
      ReactNoop.render(
        <App>
          <Text text="Two" />
        </App>,
      );
    });
    expect(ReactNoop.flush()).toEqual(['Two', 'componentDidMount']);
  });

  // Schedule an async update, elapse some time, render a bit of work
  // (without finishing), then schedule another async update.
  // The second update should flush separately from the first one.
  it("doesn't batch two async update if it already started on rendering", () => {
    class App extends React.Component {
      componentDidMount() {
        ReactNoop.yield('componentDidMount');
      }

      componentDidUpdate() {
        ReactNoop.yield('componentDidUpdate');
      }

      render() {
        return this.props.children;
      }
    }

    ReactNoop.render(
      <App>
        <Text text="A" />
        <Text text="B" />
      </App>,
    );
    ReactNoop.flushThrough(['A']);
    ReactNoop.render(
      <App>
        <Text text="C" />
        <Text text="D" />
      </App>,
    );

    ReactNoop.flushSync(() => {
      ReactNoop.renderToRootWithID('1', 'rootTwo');
    });

    expect(ReactNoop.flush()).toEqual([
      'A',
      'B',
      'componentDidMount',
      'C',
      'D',
      'componentDidUpdate',
    ]);
  });
});
