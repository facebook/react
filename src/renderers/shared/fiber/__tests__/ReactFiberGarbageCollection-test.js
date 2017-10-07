/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var React;
var ReactNoop;

describe('ReactFiberGarbageCollection', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  it('cleans up dropped fibers', () => {
    class Foo extends React.Component {
      unstable_prepareMount() {
        ReactNoop.yield(`${this.props.label} completed`);
      }
      unstable_abortMount() {
        ReactNoop.yield(`${this.props.label} dropped`);
      }
      componentWillUnmount() {
        ReactNoop.yield(`${this.props.label} unmounted`);
      }
      componentDidMount() {
        ReactNoop.yield(`${this.props.label} mounted`);
      }
      render() {
        ReactNoop.yield(`${this.props.label} began`);
        return this.props.children || null;
      }
    }

    function Bar(props) {
      return props.children;
    }

    function App() {
      return (
        <Bar>
          <Foo label="a">
            <Bar><Foo label="b" /></Bar>
            <Foo label="c" />
          </Foo>
          <Bar><Foo label="d" /></Bar>
        </Bar>
      );
    }

    const root = ReactNoop.createRoot();
    root.render(<App />);

    // Complete some of the fibers, but don't mount them
    ReactNoop.flushThrough([
      'a began',
      'b began',
      'b completed',
      'c began',
      'c completed',
      'a completed',
    ]);

    // Unmount the whole tree
    root.render(null);

    // a, b, and c should have been dropped. But not d, because it
    // didn't complete.
    expect(ReactNoop.flush()).toEqual(['a dropped', 'b dropped', 'c dropped']);

    // Render the app again, but this time mount the whole tree.
    root.render(<App />);
    ReactNoop.flush();
    // Unmount the app. a, b, c, and d should be unmounted, not dropped.
    root.render(null);
    expect(ReactNoop.flush()).toEqual([
      'a unmounted',
      'b unmounted',
      'c unmounted',
      'd unmounted',
    ]);
  });

  it('drops in-progress updates on deletion', () => {
    class Foo extends React.Component {
      unstable_prepareMount() {
        ReactNoop.yield('prepare mount');
      }
      unstable_prepareUpdate() {
        ReactNoop.yield('prepare update');
      }
      unstable_abortMount() {
        ReactNoop.yield('drop mount');
      }
      unstable_abortUpdate() {
        ReactNoop.yield('drop update');
      }
      componentDidMount() {
        ReactNoop.yield('did mount');
      }
      componentDidUpdate() {
        ReactNoop.yield('did update');
      }
      componentWillUnmount() {
        ReactNoop.yield('did unmount');
      }
      render() {
        ReactNoop.yield('render');
        return null;
      }
    }

    const root = ReactNoop.createRoot();
    // Mount the tree
    root.render([<Foo key="1" />, <span key="2" />]);
    ReactNoop.flush();

    // Start an update
    root.render([<Foo key="1" />, <span key="2" />]);
    ReactNoop.flushThrough(['render', 'prepare update']);

    // Unmount the tree. Both the mount and the update should be cleaned up.
    root.render(null);
    expect(ReactNoop.flush()).toEqual(['drop update', 'did unmount']);
  });
});
