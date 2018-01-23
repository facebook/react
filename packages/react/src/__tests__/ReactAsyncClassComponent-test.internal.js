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
          return (
            <div>
              <Wrapper>
                <Foo />
              </Wrapper>
              <div>
                <Bar />
                <Foo />
              </div>
            </div>
          );
        }
      }
      function Wrapper({children}) {
        return <div>{children}</div>;
      }
      class Foo extends React.Component {
        UNSAFE_componentWillReceiveProps() {}
        render() {
          return null;
        }
      }
      class Bar extends React.Component {
        UNSAFE_componentWillReceiveProps() {}
        render() {
          return null;
        }
      }

      let rendered;
      expect(() => {
        rendered = ReactTestRenderer.create(<SyncRoot />);
      }).toWarnDev(
        'Unsafe lifecycle methods were found within the following async tree:' +
          '\n    in AsyncRoot (at **)' +
          '\n    in SyncRoot (at **)' +
          '\n\ncomponentWillMount: Please update the following components ' +
          'to use componentDidMount instead: AsyncRoot' +
          '\n\ncomponentWillReceiveProps: Please update the following components ' +
          'to use static getDerivedStateFromProps instead: Bar, Foo' +
          '\n\ncomponentWillUpdate: Please update the following components ' +
          'to use componentDidUpdate instead: AsyncRoot' +
          '\n\nLearn more about this warning here:' +
          '\nhttps://fb.me/react-async-component-lifecycle-hooks',
      );

      // Dedupe
      rendered = ReactTestRenderer.create(<SyncRoot />);
      rendered.update(<SyncRoot />);
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
      ).toWarnDev(
        'Unsafe lifecycle methods were found within the following async tree:' +
          '\n    in AsyncRoot (at **)' +
          '\n    in SyncRoot (at **)' +
          '\n\ncomponentWillMount: Please update the following components ' +
          'to use componentDidMount instead: AsyncRoot, Parent' +
          '\n\ncomponentWillReceiveProps: Please update the following components ' +
          'to use static getDerivedStateFromProps instead: Child, Parent' +
          '\n\ncomponentWillUpdate: Please update the following components ' +
          'to use componentDidUpdate instead: AsyncRoot, Parent' +
          '\n\nLearn more about this warning here:' +
          '\nhttps://fb.me/react-async-component-lifecycle-hooks',
      );

      // Dedupe
      rendered = ReactTestRenderer.create(<SyncRoot />);
      rendered.update(<SyncRoot />);
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
        'Unsafe lifecycle methods were found within the following async tree:' +
          '\n    in AsyncRootOne (at **)' +
          '\n    in div (at **)' +
          '\n    in SyncRoot (at **)' +
          '\n\ncomponentWillMount: Please update the following components ' +
          'to use componentDidMount instead: Bar, Foo',
        'Unsafe lifecycle methods were found within the following async tree:' +
          '\n    in AsyncRootTwo (at **)' +
          '\n    in div (at **)' +
          '\n    in SyncRoot (at **)' +
          '\n\ncomponentWillMount: Please update the following components ' +
          'to use componentDidMount instead: Baz',
      ]);

      // Dedupe
      rendered = ReactTestRenderer.create(<SyncRoot />);
      rendered.update(<SyncRoot />);
    });

    it('should warn about components not present during the initial render', () => {
      class AsyncRoot extends React.unstable_AsyncComponent {
        render() {
          return this.props.foo ? <Foo /> : <Bar />;
        }
      }
      class Foo extends React.Component {
        UNSAFE_componentWillMount() {}
        render() {
          return null;
        }
      }
      class Bar extends React.Component {
        UNSAFE_componentWillMount() {}
        render() {
          return null;
        }
      }

      let rendered;
      expect(() => {
        rendered = ReactTestRenderer.create(<AsyncRoot foo={true} />);
      }).toWarnDev(
        'Unsafe lifecycle methods were found within the following async tree:' +
          '\n    in AsyncRoot (at **)' +
          '\n\ncomponentWillMount: Please update the following components ' +
          'to use componentDidMount instead: Foo' +
          '\n\nLearn more about this warning here:' +
          '\nhttps://fb.me/react-async-component-lifecycle-hooks',
      );

      expect(() => rendered.update(<AsyncRoot foo={false} />)).toWarnDev(
        'Unsafe lifecycle methods were found within the following async tree:' +
          '\n    in AsyncRoot (at **)' +
          '\n\ncomponentWillMount: Please update the following components ' +
          'to use componentDidMount instead: Bar' +
          '\n\nLearn more about this warning here:' +
          '\nhttps://fb.me/react-async-component-lifecycle-hooks',
      );

      // Dedupe
      rendered.update(<AsyncRoot foo={true} />);
      rendered.update(<AsyncRoot foo={false} />);
    });

    it('should not warn about uncommitted lifecycles in the event of an error', () => {
      let caughtError;

      class AsyncRoot extends React.unstable_AsyncComponent {
        render() {
          return <ErrorBoundary />;
        }
      }
      class ErrorBoundary extends React.Component {
        state = {
          error: null,
        };
        componentDidCatch(error) {
          caughtError = error;
          this.setState({error});
        }
        render() {
          return this.state.error ? <Bar /> : <Foo />;
        }
      }
      class Foo extends React.Component {
        UNSAFE_componentWillMount() {}
        render() {
          throw Error('whoops');
        }
      }
      class Bar extends React.Component {
        UNSAFE_componentWillMount() {}
        render() {
          return null;
        }
      }

      expect(() => {
        ReactTestRenderer.create(<AsyncRoot foo={true} />);
      }).toWarnDev(
        'Unsafe lifecycle methods were found within the following async tree:' +
          '\n    in AsyncRoot (at **)' +
          '\n\ncomponentWillMount: Please update the following components ' +
          'to use componentDidMount instead: Bar' +
          '\n\nLearn more about this warning here:' +
          '\nhttps://fb.me/react-async-component-lifecycle-hooks',
      );

      expect(caughtError).not.toBe(null);
    });
  });
});
