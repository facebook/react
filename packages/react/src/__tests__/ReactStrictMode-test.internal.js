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

describe('ReactStrictMode', () => {
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
        static getDerivedStateFromProps() {
          log.push('getDerivedStateFromProps');
          return null;
        }
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
        componentWillUnmount() {
          log.push('componentWillUnmount');
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
        'constructor',
        'getDerivedStateFromProps',
        'getDerivedStateFromProps',
        'render',
        'render',
        'componentDidMount',
      ]);

      log = [];
      shouldComponentUpdate = true;

      component.update(<ClassComponent />);
      expect(log).toEqual([
        'getDerivedStateFromProps',
        'getDerivedStateFromProps',
        'shouldComponentUpdate',
        'render',
        'render',
        'componentDidUpdate',
      ]);

      log = [];
      shouldComponentUpdate = false;

      component.update(<ClassComponent />);
      expect(log).toEqual([
        'getDerivedStateFromProps',
        'getDerivedStateFromProps',
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

  [true, false].forEach(debugRenderPhaseSideEffectsForStrictMode => {
    describe(`StrictMode (${debugRenderPhaseSideEffectsForStrictMode})`, () => {
      beforeEach(() => {
        jest.resetModules();
        ReactFeatureFlags = require('shared/ReactFeatureFlags');
        ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = debugRenderPhaseSideEffectsForStrictMode;
        React = require('react');
        ReactTestRenderer = require('react-test-renderer');
      });

      it('should invoke precommit lifecycle methods twice in DEV', () => {
        const {StrictMode} = React;

        let log = [];
        let shouldComponentUpdate = false;

        function Root() {
          return (
            <StrictMode>
              <ClassComponent />
            </StrictMode>
          );
        }

        class ClassComponent extends React.Component {
          state = {};
          static getDerivedStateFromProps() {
            log.push('getDerivedStateFromProps');
            return null;
          }
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
          componentWillUnmount() {
            log.push('componentWillUnmount');
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

        const component = ReactTestRenderer.create(<Root />);

        if (debugRenderPhaseSideEffectsForStrictMode) {
          expect(log).toEqual([
            'constructor',
            'constructor',
            'getDerivedStateFromProps',
            'getDerivedStateFromProps',
            'render',
            'render',
            'componentDidMount',
          ]);
        } else {
          expect(log).toEqual([
            'constructor',
            'getDerivedStateFromProps',
            'render',
            'componentDidMount',
          ]);
        }

        log = [];
        shouldComponentUpdate = true;

        component.update(<Root />);
        if (debugRenderPhaseSideEffectsForStrictMode) {
          expect(log).toEqual([
            'getDerivedStateFromProps',
            'getDerivedStateFromProps',
            'shouldComponentUpdate',
            'render',
            'render',
            'componentDidUpdate',
          ]);
        } else {
          expect(log).toEqual([
            'getDerivedStateFromProps',
            'shouldComponentUpdate',
            'render',
            'componentDidUpdate',
          ]);
        }

        log = [];
        shouldComponentUpdate = false;

        component.update(<Root />);
        if (debugRenderPhaseSideEffectsForStrictMode) {
          expect(log).toEqual([
            'getDerivedStateFromProps',
            'getDerivedStateFromProps',
            'shouldComponentUpdate',
          ]);
        } else {
          expect(log).toEqual([
            'getDerivedStateFromProps',
            'shouldComponentUpdate',
          ]);
        }
      });

      it('should invoke setState callbacks twice in DEV', () => {
        const {StrictMode} = React;

        let instance;
        class ClassComponent extends React.Component {
          state = {
            count: 1,
          };
          render() {
            instance = this;
            return null;
          }
        }

        let setStateCount = 0;

        ReactTestRenderer.create(
          <StrictMode>
            <ClassComponent />
          </StrictMode>,
        );
        instance.setState(state => {
          setStateCount++;
          return {
            count: state.count + 1,
          };
        });

        // Callback should be invoked twice (in DEV)
        expect(setStateCount).toBe(
          debugRenderPhaseSideEffectsForStrictMode ? 2 : 1,
        );
        // But each time `state` should be the previous value
        expect(instance.state.count).toBe(2);
      });
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
          return (
            <React.unstable_AsyncMode>
              <AsyncRoot />
            </React.unstable_AsyncMode>
          );
        }
      }
      class AsyncRoot extends React.Component {
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
        'Unsafe lifecycle methods were found within a strict-mode tree:' +
          '\n    in SyncRoot (at **)' +
          '\n\ncomponentWillMount: Please update the following components ' +
          'to use componentDidMount instead: AsyncRoot' +
          '\n\ncomponentWillReceiveProps: Please update the following components ' +
          'to use static getDerivedStateFromProps instead: Bar, Foo' +
          '\n\ncomponentWillUpdate: Please update the following components ' +
          'to use componentDidUpdate instead: AsyncRoot' +
          '\n\nLearn more about this warning here:' +
          '\nhttps://fb.me/react-strict-mode-warnings',
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
          return (
            <React.unstable_AsyncMode>
              <AsyncRoot />
            </React.unstable_AsyncMode>
          );
        }
      }
      class AsyncRoot extends React.Component {
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
        'Unsafe lifecycle methods were found within a strict-mode tree:' +
          '\n    in SyncRoot (at **)' +
          '\n\ncomponentWillMount: Please update the following components ' +
          'to use componentDidMount instead: AsyncRoot, Parent' +
          '\n\ncomponentWillReceiveProps: Please update the following components ' +
          'to use static getDerivedStateFromProps instead: Child, Parent' +
          '\n\ncomponentWillUpdate: Please update the following components ' +
          'to use componentDidUpdate instead: AsyncRoot, Parent' +
          '\n\nLearn more about this warning here:' +
          '\nhttps://fb.me/react-strict-mode-warnings',
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
      class AsyncRootOne extends React.Component {
        render() {
          return (
            <React.unstable_AsyncMode>
              <Foo>
                <Bar />
              </Foo>
            </React.unstable_AsyncMode>
          );
        }
      }
      class AsyncRootTwo extends React.Component {
        render() {
          return (
            <React.unstable_AsyncMode>
              <Foo>
                <Baz />
              </Foo>
            </React.unstable_AsyncMode>
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
        'Unsafe lifecycle methods were found within a strict-mode tree:' +
          '\n    in AsyncRootOne (at **)' +
          '\n    in div (at **)' +
          '\n    in SyncRoot (at **)' +
          '\n\ncomponentWillMount: Please update the following components ' +
          'to use componentDidMount instead: Bar, Foo',
        'Unsafe lifecycle methods were found within a strict-mode tree:' +
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
      class AsyncRoot extends React.Component {
        render() {
          return (
            <React.unstable_AsyncMode>
              {this.props.foo ? <Foo /> : <Bar />}
            </React.unstable_AsyncMode>
          );
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
        'Unsafe lifecycle methods were found within a strict-mode tree:' +
          '\n    in AsyncRoot (at **)' +
          '\n\ncomponentWillMount: Please update the following components ' +
          'to use componentDidMount instead: Foo' +
          '\n\nLearn more about this warning here:' +
          '\nhttps://fb.me/react-strict-mode-warnings',
      );

      expect(() => rendered.update(<AsyncRoot foo={false} />)).toWarnDev(
        'Unsafe lifecycle methods were found within a strict-mode tree:' +
          '\n    in AsyncRoot (at **)' +
          '\n\ncomponentWillMount: Please update the following components ' +
          'to use componentDidMount instead: Bar' +
          '\n\nLearn more about this warning here:' +
          '\nhttps://fb.me/react-strict-mode-warnings',
      );

      // Dedupe
      rendered.update(<AsyncRoot foo={true} />);
      rendered.update(<AsyncRoot foo={false} />);
    });

    it('should not warn about uncommitted lifecycles in the event of an error', () => {
      let caughtError;

      class AsyncRoot extends React.Component {
        render() {
          return (
            <React.unstable_AsyncMode>
              <ErrorBoundary />
            </React.unstable_AsyncMode>
          );
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
        'Unsafe lifecycle methods were found within a strict-mode tree:' +
          '\n    in AsyncRoot (at **)' +
          '\n\ncomponentWillMount: Please update the following components ' +
          'to use componentDidMount instead: Bar' +
          '\n\nLearn more about this warning here:' +
          '\nhttps://fb.me/react-strict-mode-warnings',
      );

      expect(caughtError).not.toBe(null);
    });

    it('should also warn inside of "strict" mode trees', () => {
      const {StrictMode} = React;

      class SyncRoot extends React.Component {
        UNSAFE_componentWillMount() {}
        UNSAFE_componentWillUpdate() {}
        UNSAFE_componentWillReceiveProps() {}
        render() {
          return (
            <StrictMode>
              <Wrapper />
            </StrictMode>
          );
        }
      }
      function Wrapper({children}) {
        return (
          <div>
            <Bar />
            <Foo />
          </div>
        );
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

      expect(() => ReactTestRenderer.create(<SyncRoot />)).toWarnDev(
        'Unsafe lifecycle methods were found within a strict-mode tree:' +
          '\n    in SyncRoot (at **)' +
          '\n\ncomponentWillReceiveProps: Please update the following components ' +
          'to use static getDerivedStateFromProps instead: Bar, Foo' +
          '\n\nLearn more about this warning here:' +
          '\nhttps://fb.me/react-strict-mode-warnings',
      );

      // Dedupe
      const rendered = ReactTestRenderer.create(<SyncRoot />);
      rendered.update(<SyncRoot />);
    });
  });

  describe('symbol checks', () => {
    beforeEach(() => {
      jest.resetModules();
      React = require('react');
      ReactTestRenderer = require('react-test-renderer');
    });

    it('should switch from StrictMode to a Fragment and reset state', () => {
      const {Fragment, StrictMode} = React;

      function ParentComponent({useFragment}) {
        return useFragment ? (
          <Fragment>
            <ChildComponent />
          </Fragment>
        ) : (
          <StrictMode>
            <ChildComponent />
          </StrictMode>
        );
      }

      class ChildComponent extends React.Component {
        state = {
          count: 0,
        };
        static getDerivedStateFromProps(nextProps, prevState) {
          return {
            count: prevState.count + 1,
          };
        }
        render() {
          return `count:${this.state.count}`;
        }
      }

      const rendered = ReactTestRenderer.create(
        <ParentComponent useFragment={false} />,
      );
      expect(rendered.toJSON()).toBe('count:1');
      rendered.update(<ParentComponent useFragment={true} />);
      expect(rendered.toJSON()).toBe('count:1');
    });

    it('should switch from a Fragment to StrictMode and reset state', () => {
      const {Fragment, StrictMode} = React;

      function ParentComponent({useFragment}) {
        return useFragment ? (
          <Fragment>
            <ChildComponent />
          </Fragment>
        ) : (
          <StrictMode>
            <ChildComponent />
          </StrictMode>
        );
      }

      class ChildComponent extends React.Component {
        state = {
          count: 0,
        };
        static getDerivedStateFromProps(nextProps, prevState) {
          return {
            count: prevState.count + 1,
          };
        }
        render() {
          return `count:${this.state.count}`;
        }
      }

      const rendered = ReactTestRenderer.create(
        <ParentComponent useFragment={true} />,
      );
      expect(rendered.toJSON()).toBe('count:1');
      rendered.update(<ParentComponent useFragment={false} />);
      expect(rendered.toJSON()).toBe('count:1');
    });

    it('should update with StrictMode without losing state', () => {
      const {StrictMode} = React;

      function ParentComponent() {
        return (
          <StrictMode>
            <ChildComponent />
          </StrictMode>
        );
      }

      class ChildComponent extends React.Component {
        state = {
          count: 0,
        };
        static getDerivedStateFromProps(nextProps, prevState) {
          return {
            count: prevState.count + 1,
          };
        }
        render() {
          return `count:${this.state.count}`;
        }
      }

      const rendered = ReactTestRenderer.create(<ParentComponent />);
      expect(rendered.toJSON()).toBe('count:1');
      rendered.update(<ParentComponent />);
      expect(rendered.toJSON()).toBe('count:2');
    });
  });
});
