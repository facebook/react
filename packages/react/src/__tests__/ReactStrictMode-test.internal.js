/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let Scheduler;
let ReactFeatureFlags;
let ReactTestRenderer;
let PropTypes;

describe('ReactStrictMode', () => {
  describe('debugRenderPhaseSideEffects', () => {
    beforeEach(() => {
      jest.resetModules();
      ReactFeatureFlags = require('shared/ReactFeatureFlags');
      ReactFeatureFlags.debugRenderPhaseSideEffects = true;
      React = require('react');
      Scheduler = require('scheduler');
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

      if (__DEV__) {
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

      component.update(<ClassComponent />);
      if (__DEV__) {
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

      component.update(<ClassComponent />);

      if (__DEV__) {
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

      // Callback should be invoked twice in DEV
      expect(setStateCount).toBe(__DEV__ ? 2 : 1);
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
        Scheduler = require('scheduler');
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

        if (__DEV__ && debugRenderPhaseSideEffectsForStrictMode) {
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
        if (__DEV__ && debugRenderPhaseSideEffectsForStrictMode) {
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
        if (__DEV__ && debugRenderPhaseSideEffectsForStrictMode) {
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
          __DEV__ && debugRenderPhaseSideEffectsForStrictMode ? 2 : 1,
        );
        // But each time `state` should be the previous value
        expect(instance.state.count).toBe(2);
      });
    });
  });

  describe('Concurrent Mode', () => {
    beforeEach(() => {
      jest.resetModules();

      React = require('react');
      Scheduler = require('scheduler');
      ReactTestRenderer = require('react-test-renderer');
    });

    it('should warn about unsafe legacy lifecycle methods anywhere in the tree', () => {
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

      const root = ReactTestRenderer.create(null, {
        unstable_isConcurrent: true,
      });
      root.update(<AsyncRoot />);
      expect(() => Scheduler.unstable_flushAll()).toWarnDev(
        [
          /* eslint-disable max-len */
          `Warning: Using UNSAFE_componentWillMount in strict mode is not recommended and may indicate bugs in your code. See https://fb.me/react-async-component-lifecycle-hooks for details.

* Move code with side effects to componentDidMount, and set initial state in the constructor.

Please update the following components: AsyncRoot`,
          `Warning: Using UNSAFE_componentWillReceiveProps in strict mode is not recommended and may indicate bugs in your code. See https://fb.me/react-async-component-lifecycle-hooks for details.

* Move data fetching code or side effects to componentDidUpdate.
* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://fb.me/react-derived-state

Please update the following components: Bar, Foo`,
          `Warning: Using UNSAFE_componentWillUpdate in strict mode is not recommended and may indicate bugs in your code. See https://fb.me/react-async-component-lifecycle-hooks for details.

* Move data fetching code or side effects to componentDidUpdate.

Please update the following components: AsyncRoot`,
          /* eslint-enable max-len */
        ],
        {withoutStack: true},
      );

      // Dedupe
      root.update(<AsyncRoot />);
      Scheduler.unstable_flushAll();
    });

    it('should coalesce warnings by lifecycle name', () => {
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

      const root = ReactTestRenderer.create(null, {
        unstable_isConcurrent: true,
      });
      root.update(<AsyncRoot />);

      expect(() => {
        expect(() => Scheduler.unstable_flushAll()).toWarnDev(
          [
            /* eslint-disable max-len */
            `Warning: Using UNSAFE_componentWillMount in strict mode is not recommended and may indicate bugs in your code. See https://fb.me/react-async-component-lifecycle-hooks for details.

* Move code with side effects to componentDidMount, and set initial state in the constructor.

Please update the following components: AsyncRoot`,
            `Warning: Using UNSAFE_componentWillReceiveProps in strict mode is not recommended and may indicate bugs in your code. See https://fb.me/react-async-component-lifecycle-hooks for details.

* Move data fetching code or side effects to componentDidUpdate.
* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://fb.me/react-derived-state

Please update the following components: Child`,
            `Warning: Using UNSAFE_componentWillUpdate in strict mode is not recommended and may indicate bugs in your code. See https://fb.me/react-async-component-lifecycle-hooks for details.

* Move data fetching code or side effects to componentDidUpdate.

Please update the following components: AsyncRoot`,
            /* eslint-enable max-len */
          ],
          {withoutStack: true},
        );
      }).toLowPriorityWarnDev(
        [
          /* eslint-disable max-len */
          `Warning: componentWillMount has been renamed, and is not recommended for use. See https://fb.me/react-async-component-lifecycle-hooks for details.

* Move code with side effects to componentDidMount, and set initial state in the constructor.
* Rename componentWillMount to UNSAFE_componentWillMount to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: Parent`,
          `Warning: componentWillReceiveProps has been renamed, and is not recommended for use. See https://fb.me/react-async-component-lifecycle-hooks for details.

* Move data fetching code or side effects to componentDidUpdate.
* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://fb.me/react-derived-state
* Rename componentWillReceiveProps to UNSAFE_componentWillReceiveProps to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: Parent`,
          `Warning: componentWillUpdate has been renamed, and is not recommended for use. See https://fb.me/react-async-component-lifecycle-hooks for details.

* Move data fetching code or side effects to componentDidUpdate.
* Rename componentWillUpdate to UNSAFE_componentWillUpdate to suppress this warning in non-strict mode. In React 17.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: Parent`,
          /* eslint-enable max-len */
        ],
        {withoutStack: true},
      );
      // Dedupe
      root.update(<AsyncRoot />);
      Scheduler.unstable_flushAll();
    });

    it('should warn about components not present during the initial render', () => {
      class AsyncRoot extends React.Component {
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

      const root = ReactTestRenderer.create(null, {
        unstable_isConcurrent: true,
      });
      root.update(<AsyncRoot foo={true} />);
      expect(() => Scheduler.unstable_flushAll()).toWarnDev(
        'Using UNSAFE_componentWillMount in strict mode is not recommended',
        {withoutStack: true},
      );

      root.update(<AsyncRoot foo={false} />);
      expect(() => Scheduler.unstable_flushAll()).toWarnDev(
        'Using UNSAFE_componentWillMount in strict mode is not recommended',
        {withoutStack: true},
      );

      // Dedupe
      root.update(<AsyncRoot foo={true} />);
      Scheduler.unstable_flushAll();
      root.update(<AsyncRoot foo={false} />);
      Scheduler.unstable_flushAll();
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
        'Using UNSAFE_componentWillReceiveProps in strict mode is not recommended',
        {withoutStack: true},
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

  describe('string refs', () => {
    beforeEach(() => {
      jest.resetModules();
      React = require('react');
      ReactTestRenderer = require('react-test-renderer');
    });

    it('should warn within a strict tree', () => {
      const {StrictMode} = React;

      class OuterComponent extends React.Component {
        render() {
          return (
            <StrictMode>
              <InnerComponent ref="somestring" />
            </StrictMode>
          );
        }
      }

      class InnerComponent extends React.Component {
        render() {
          return null;
        }
      }

      let renderer;
      expect(() => {
        renderer = ReactTestRenderer.create(<OuterComponent />);
      }).toWarnDev(
        'Warning: A string ref, "somestring", has been found within a strict mode tree. ' +
          'String refs are a source of potential bugs and should be avoided. ' +
          'We recommend using createRef() instead.\n\n' +
          '    in StrictMode (at **)\n' +
          '    in OuterComponent (at **)\n\n' +
          'Learn more about using refs safely here:\n' +
          'https://fb.me/react-strict-mode-string-ref',
      );

      // Dedup
      renderer.update(<OuterComponent />);
    });

    it('should warn within a strict tree', () => {
      const {StrictMode} = React;

      class OuterComponent extends React.Component {
        render() {
          return (
            <StrictMode>
              <InnerComponent />
            </StrictMode>
          );
        }
      }

      class InnerComponent extends React.Component {
        render() {
          return <MiddleComponent ref="somestring" />;
        }
      }

      class MiddleComponent extends React.Component {
        render() {
          return null;
        }
      }

      let renderer;
      expect(() => {
        renderer = ReactTestRenderer.create(<OuterComponent />);
      }).toWarnDev(
        'Warning: A string ref, "somestring", has been found within a strict mode tree. ' +
          'String refs are a source of potential bugs and should be avoided. ' +
          'We recommend using createRef() instead.\n\n' +
          '    in InnerComponent (at **)\n' +
          '    in StrictMode (at **)\n' +
          '    in OuterComponent (at **)\n\n' +
          'Learn more about using refs safely here:\n' +
          'https://fb.me/react-strict-mode-string-ref',
      );

      // Dedup
      renderer.update(<OuterComponent />);
    });
  });

  describe('context legacy', () => {
    beforeEach(() => {
      jest.resetModules();
      React = require('react');
      ReactTestRenderer = require('react-test-renderer');
      PropTypes = require('prop-types');
    });

    it('should warn if the legacy context API have been used in strict mode', () => {
      class LegacyContextProvider extends React.Component {
        getChildContext() {
          return {color: 'purple'};
        }

        render() {
          return (
            <div>
              <LegacyContextConsumer />
              <FunctionalLegacyContextConsumer />
            </div>
          );
        }
      }

      function FunctionalLegacyContextConsumer() {
        return null;
      }

      LegacyContextProvider.childContextTypes = {
        color: PropTypes.string,
      };

      class LegacyContextConsumer extends React.Component {
        render() {
          return null;
        }
      }

      const {StrictMode} = React;

      class Root extends React.Component {
        render() {
          return (
            <div>
              <StrictMode>
                <LegacyContextProvider />
              </StrictMode>
            </div>
          );
        }
      }

      LegacyContextConsumer.contextTypes = {
        color: PropTypes.string,
      };

      FunctionalLegacyContextConsumer.contextTypes = {
        color: PropTypes.string,
      };

      let rendered;

      expect(() => {
        rendered = ReactTestRenderer.create(<Root />);
      }).toWarnDev(
        'Warning: Legacy context API has been detected within a strict-mode tree: ' +
          '\n    in StrictMode (at **)' +
          '\n    in div (at **)' +
          '\n    in Root (at **)' +
          '\n\nThe old API will be supported in all 16.x releases, but applications ' +
          'using it should migrate to the new version.' +
          '\n\nPlease update the following components: ' +
          'FunctionalLegacyContextConsumer, LegacyContextConsumer, LegacyContextProvider' +
          '\n\nLearn more about this warning here:' +
          '\nhttps://fb.me/react-legacy-context',
      );

      // Dedupe
      rendered = ReactTestRenderer.create(<Root />);
      rendered.update(<Root />);
    });
  });
});
