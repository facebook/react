/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactFeatureFlags;
let ReactTestRenderer;

describe('ReactAsyncClassComponent', () => {
  describe('debugRenderPhaseSideEffects', () => {
    beforeEach(() => {
      jest.resetModules();
      ReactFeatureFlags = require('shared/ReactFeatureFlags');
      ReactFeatureFlags.debugRenderPhaseSideEffects = true;
      React = require('react');
      ReactTestRenderer = require('react-test-renderer');
    });

    it('should invoke precommit lifecycle methods twice', () => {
      let log = [];
      let shouldComponentUpdate = false;
      class ClassComponent extends React.Component {
        state = {};
        constructor(props) {
          super(props);
          log.push('constructor');
        }
        componentDidMount() {
          log.push('componentDidMount');
        }
        componentDidUpdate() {
          log.push('componentDidUpdate');
        }
        UNSAFE_componentWillMount() {
          log.push('componentWillMount');
        }
        UNSAFE_componentWillReceiveProps() {
          log.push('componentWillReceiveProps');
        }
        componentWillUnmount() {
          log.push('componentWillUnmount');
        }
        UNSAFE_componentWillUpdate() {
          log.push('componentWillUpdate');
        }
        shouldComponentUpdate() {
          log.push('shouldComponentUpdate');
          return shouldComponentUpdate;
        }
        render() {
          log.push('render');
          return null;
        }
      }

      const component = ReactTestRenderer.create(<ClassComponent />);
      expect(log).toEqual([
        'constructor',
        'componentWillMount',
        'constructor',
        'componentWillMount',
        'render',
        'render',
        'componentDidMount',
      ]);

      log = [];
      shouldComponentUpdate = true;

      component.update(<ClassComponent />);
      expect(log).toEqual([
        'componentWillReceiveProps',
        'componentWillReceiveProps',
        'shouldComponentUpdate',
        'shouldComponentUpdate',
        'componentWillUpdate',
        'componentWillUpdate',
        'render',
        'render',
        'componentDidUpdate',
      ]);

      log = [];
      shouldComponentUpdate = false;

      component.update(<ClassComponent />);
      expect(log).toEqual([
        'componentWillReceiveProps',
        'componentWillReceiveProps',
        'shouldComponentUpdate',
        'shouldComponentUpdate',
      ]);
    });

    it('should invoke setState callbacks twice', () => {
      class ClassComponent extends React.Component {
        state = {
          count: 1,
        };
        render() {
          return null;
        }
      }

      let setStateCount = 0;

      const rendered = ReactTestRenderer.create(<ClassComponent />);
      const instance = rendered.getInstance();
      instance.setState(state => {
        setStateCount++;
        return {
          count: state.count + 1,
        };
      });

      // Callback should be invoked twice
      expect(setStateCount).toBe(2);
      // But each time `state` should be the previous value
      expect(instance.state.count).toBe(2);
    });
  });

  describe('async subtree', () => {
    beforeEach(() => {
      jest.resetModules();

      React = require('react');
      ReactTestRenderer = require('react-test-renderer');
    });

    it('should warn about unsafe legacy lifecycle methods within the tree', () => {
      class SyncRoot extends React.Component {
        UNSAFE_componentWillMount() {}
        UNSAFE_componentWillUpdate() {}
        UNSAFE_componentWillReceiveProps() {}
        render() {
          return <AsyncRoot />;
        }
      }
      class AsyncRoot extends React.unstable_AsyncComponent {
        UNSAFE_componentWillMount() {}
        UNSAFE_componentWillUpdate() {}
        render() {
          return <Child />;
        }
      }
      class Child extends React.Component {
        UNSAFE_componentWillReceiveProps() {}
        render() {
          return null;
        }
      }

      let rendered;

      expect(() => {
        rendered = ReactTestRenderer.create(<SyncRoot />);
      }).toWarnDev([
        'An unsafe lifecycle method, UNSAFE_componentWillMount, ' +
          'has been detected within an async tree. ' +
          'Please update the following components: AsyncRoot' +
          '\n\nThe async tree is located:' +
          '\n    in AsyncRoot (at **)' +
          '\n    in SyncRoot (at **)',
        'An unsafe lifecycle method, UNSAFE_componentWillReceiveProps, ' +
          'has been detected within an async tree. ' +
          'Please update the following components: Child' +
          '\n\nThe async tree is located:' +
          '\n    in AsyncRoot (at **)' +
          '\n    in SyncRoot (at **)',
        'An unsafe lifecycle method, UNSAFE_componentWillUpdate, ' +
          'has been detected within an async tree. ' +
          'Please update the following components: AsyncRoot' +
          '\n\nThe async tree is located:' +
          '\n    in AsyncRoot (at **)' +
          '\n    in SyncRoot (at **)',
      ]);

      // Dedupe
      rendered.update(<SyncRoot />);
      rendered = ReactTestRenderer.create(<SyncRoot />);
    });

    it('should coalesce warnings by lifecycle name', () => {
      class SyncRoot extends React.Component {
        UNSAFE_componentWillMount() {}
        UNSAFE_componentWillUpdate() {}
        UNSAFE_componentWillReceiveProps() {}
        render() {
          return <AsyncRoot />;
        }
      }
      class AsyncRoot extends React.unstable_AsyncComponent {
        UNSAFE_componentWillMount() {}
        UNSAFE_componentWillUpdate() {}
        render() {
          return <Parent />;
        }
      }
      class Parent extends React.Component {
        componentWillMount() {}
        componentWillUpdate() {}
        componentWillReceiveProps() {}
        render() {
          return <Child />;
        }
      }
      class Child extends React.Component {
        UNSAFE_componentWillReceiveProps() {}
        render() {
          return null;
        }
      }

      let rendered;

      expect(
        () => (rendered = ReactTestRenderer.create(<SyncRoot />)),
      ).toWarnDev([
        'An unsafe lifecycle method, UNSAFE_componentWillMount, ' +
          'has been detected within an async tree. Please update ' +
          'the following components: AsyncRoot, Parent' +
          '\n\nThe async tree is located:' +
          '\n    in AsyncRoot (at **)' +
          '\n    in SyncRoot (at **)',
        'An unsafe lifecycle method, UNSAFE_componentWillReceiveProps, ' +
          'has been detected within an async tree. Please update ' +
          'the following components: Parent, Child' +
          '\n\nThe async tree is located:' +
          '\n    in AsyncRoot (at **)' +
          '\n    in SyncRoot (at **)',
        'An unsafe lifecycle method, UNSAFE_componentWillUpdate, ' +
          'has been detected within an async tree. Please update ' +
          'the following components: AsyncRoot, Parent' +
          '\n\nThe async tree is located:' +
          '\n    in AsyncRoot (at **)' +
          '\n    in SyncRoot (at **)',
      ]);

      // Dedupe
      rendered.update(<SyncRoot />);
      rendered = ReactTestRenderer.create(<SyncRoot />);
    });

    it('should group warnings by async root', () => {
      class SyncRoot extends React.Component {
        UNSAFE_componentWillMount() {}
        UNSAFE_componentWillUpdate() {}
        UNSAFE_componentWillReceiveProps() {}
        render() {
          return (
            <div>
              <AsyncRootOne />
              <AsyncRootTwo />
            </div>
          );
        }
      }
      class AsyncRootOne extends React.unstable_AsyncComponent {
        render() {
          return (
            <Foo>
              <Bar />
            </Foo>
          );
        }
      }
      class AsyncRootTwo extends React.unstable_AsyncComponent {
        render() {
          return (
            <Foo>
              <Baz />
            </Foo>
          );
        }
      }
      class Foo extends React.Component {
        componentWillMount() {}
        render() {
          return this.props.children;
        }
      }
      class Bar extends React.Component {
        componentWillMount() {}
        render() {
          return null;
        }
      }
      class Baz extends React.Component {
        componentWillMount() {}
        render() {
          return null;
        }
      }

      let rendered;

      expect(
        () => (rendered = ReactTestRenderer.create(<SyncRoot />)),
      ).toWarnDev([
        'An unsafe lifecycle method, UNSAFE_componentWillMount, ' +
          'has been detected within an async tree. Please update ' +
          'the following components: Foo, Bar' +
          '\n\nThe async tree is located:' +
          '\n    in AsyncRootOne (at **)' +
          '\n    in div (at **)' +
          '\n    in SyncRoot (at **)',
        'An unsafe lifecycle method, UNSAFE_componentWillMount, ' +
          'has been detected within an async tree. Please update ' +
          'the following components: Baz' +
          '\n\nThe async tree is located:' +
          '\n    in AsyncRootTwo (at **)' +
          '\n    in div (at **)' +
          '\n    in SyncRoot (at **)',
      ]);

      // Dedupe
      rendered.update(<SyncRoot />);
      rendered = ReactTestRenderer.create(<SyncRoot />);
    });
  });
});
