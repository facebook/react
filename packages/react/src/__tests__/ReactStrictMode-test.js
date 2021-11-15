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
let ReactDOM;
let ReactDOMServer;
let Scheduler;
let PropTypes;

const ReactFeatureFlags = require('shared/ReactFeatureFlags');

describe('ReactStrictMode', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
  });

  it('should appear in the client component stack', () => {
    function Foo() {
      return <div ariaTypo="" />;
    }

    const container = document.createElement('div');
    expect(() => {
      ReactDOM.render(
        <React.StrictMode>
          <Foo />
        </React.StrictMode>,
        container,
      );
    }).toErrorDev(
      'Invalid ARIA attribute `ariaTypo`. ' +
        'ARIA attributes follow the pattern aria-* and must be lowercase.\n' +
        '    in div (at **)\n' +
        '    in Foo (at **)',
    );
  });

  it('should appear in the SSR component stack', () => {
    function Foo() {
      return <div ariaTypo="" />;
    }

    expect(() => {
      ReactDOMServer.renderToString(
        <React.StrictMode>
          <Foo />
        </React.StrictMode>,
      );
    }).toErrorDev(
      'Invalid ARIA attribute `ariaTypo`. ' +
        'ARIA attributes follow the pattern aria-* and must be lowercase.\n' +
        '    in div (at **)\n' +
        '    in Foo (at **)',
    );
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

    const container = document.createElement('div');
    ReactDOM.render(
      <React.StrictMode>
        <ClassComponent />
      </React.StrictMode>,
      container,
    );

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

    ReactDOM.render(
      <React.StrictMode>
        <ClassComponent />
      </React.StrictMode>,
      container,
    );
    if (__DEV__) {
      expect(log).toEqual([
        'getDerivedStateFromProps',
        'getDerivedStateFromProps',
        'shouldComponentUpdate',
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

    ReactDOM.render(
      <React.StrictMode>
        <ClassComponent />
      </React.StrictMode>,
      container,
    );

    if (__DEV__) {
      expect(log).toEqual([
        'getDerivedStateFromProps',
        'getDerivedStateFromProps',
        'shouldComponentUpdate',
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

    const container = document.createElement('div');
    ReactDOM.render(
      <React.StrictMode>
        <ClassComponent />
      </React.StrictMode>,
      container,
    );
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

    const container = document.createElement('div');
    ReactDOM.render(<Root />, container);

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

    ReactDOM.render(<Root />, container);
    if (__DEV__) {
      expect(log).toEqual([
        'getDerivedStateFromProps',
        'getDerivedStateFromProps',
        'shouldComponentUpdate',
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

    ReactDOM.render(<Root />, container);
    if (__DEV__) {
      expect(log).toEqual([
        'getDerivedStateFromProps',
        'getDerivedStateFromProps',
        'shouldComponentUpdate',
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

    const container = document.createElement('div');
    ReactDOM.render(
      <StrictMode>
        <ClassComponent />
      </StrictMode>,
      container,
    );
    instance.setState(state => {
      setStateCount++;
      return {
        count: state.count + 1,
      };
    });

    // Callback should be invoked twice (in DEV)
    expect(setStateCount).toBe(__DEV__ ? 2 : 1);
    // But each time `state` should be the previous value
    expect(instance.state.count).toBe(2);
  });
});

describe('Concurrent Mode', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    Scheduler = require('scheduler');
  });

  it('should warn about unsafe legacy lifecycle methods anywhere in a StrictMode tree', () => {
    function StrictRoot() {
      return (
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    }
    class App extends React.Component {
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

    const container = document.createElement('div');
    const root = ReactDOM.createRoot(container);
    root.render(<StrictRoot />);
    expect(() => Scheduler.unstable_flushAll()).toErrorDev(
      [
        /* eslint-disable max-len */
        `Warning: Using UNSAFE_componentWillMount in strict mode is not recommended and may indicate bugs in your code. See https://reactjs.org/link/unsafe-component-lifecycles for details.

* Move code with side effects to componentDidMount, and set initial state in the constructor.

Please update the following components: App`,
        `Warning: Using UNSAFE_componentWillReceiveProps in strict mode is not recommended and may indicate bugs in your code. See https://reactjs.org/link/unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://reactjs.org/link/derived-state

Please update the following components: Bar, Foo`,
        `Warning: Using UNSAFE_componentWillUpdate in strict mode is not recommended and may indicate bugs in your code. See https://reactjs.org/link/unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.

Please update the following components: App`,
        /* eslint-enable max-len */
      ],
      {withoutStack: true},
    );

    // Dedupe
    root.render(<App />);
    Scheduler.unstable_flushAll();
  });

  it('should coalesce warnings by lifecycle name', () => {
    function StrictRoot() {
      return (
        <React.StrictMode>
          <App />
        </React.StrictMode>
      );
    }
    class App extends React.Component {
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

    const container = document.createElement('div');
    const root = ReactDOM.createRoot(container);
    root.render(<StrictRoot />);

    expect(() => {
      expect(() => Scheduler.unstable_flushAll()).toErrorDev(
        [
          /* eslint-disable max-len */
          `Warning: Using UNSAFE_componentWillMount in strict mode is not recommended and may indicate bugs in your code. See https://reactjs.org/link/unsafe-component-lifecycles for details.

* Move code with side effects to componentDidMount, and set initial state in the constructor.

Please update the following components: App`,
          `Warning: Using UNSAFE_componentWillReceiveProps in strict mode is not recommended and may indicate bugs in your code. See https://reactjs.org/link/unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://reactjs.org/link/derived-state

Please update the following components: Child`,
          `Warning: Using UNSAFE_componentWillUpdate in strict mode is not recommended and may indicate bugs in your code. See https://reactjs.org/link/unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.

Please update the following components: App`,
          /* eslint-enable max-len */
        ],
        {withoutStack: true},
      );
    }).toWarnDev(
      [
        /* eslint-disable max-len */
        `Warning: componentWillMount has been renamed, and is not recommended for use. See https://reactjs.org/link/unsafe-component-lifecycles for details.

* Move code with side effects to componentDidMount, and set initial state in the constructor.
* Rename componentWillMount to UNSAFE_componentWillMount to suppress this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: Parent`,
        `Warning: componentWillReceiveProps has been renamed, and is not recommended for use. See https://reactjs.org/link/unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* If you're updating state whenever props change, refactor your code to use memoization techniques or move it to static getDerivedStateFromProps. Learn more at: https://reactjs.org/link/derived-state
* Rename componentWillReceiveProps to UNSAFE_componentWillReceiveProps to suppress this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: Parent`,
        `Warning: componentWillUpdate has been renamed, and is not recommended for use. See https://reactjs.org/link/unsafe-component-lifecycles for details.

* Move data fetching code or side effects to componentDidUpdate.
* Rename componentWillUpdate to UNSAFE_componentWillUpdate to suppress this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. To rename all deprecated lifecycles to their new names, you can run \`npx react-codemod rename-unsafe-lifecycles\` in your project source folder.

Please update the following components: Parent`,
        /* eslint-enable max-len */
      ],
      {withoutStack: true},
    );
    // Dedupe
    root.render(<StrictRoot />);
    Scheduler.unstable_flushAll();
  });

  it('should warn about components not present during the initial render', () => {
    function StrictRoot({foo}) {
      return <React.StrictMode>{foo ? <Foo /> : <Bar />}</React.StrictMode>;
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

    const container = document.createElement('div');
    const root = ReactDOM.createRoot(container);
    root.render(<StrictRoot foo={true} />);
    expect(() =>
      Scheduler.unstable_flushAll(),
    ).toErrorDev(
      'Using UNSAFE_componentWillMount in strict mode is not recommended',
      {withoutStack: true},
    );

    root.render(<StrictRoot foo={false} />);
    expect(() =>
      Scheduler.unstable_flushAll(),
    ).toErrorDev(
      'Using UNSAFE_componentWillMount in strict mode is not recommended',
      {withoutStack: true},
    );

    // Dedupe
    root.render(<StrictRoot foo={true} />);
    Scheduler.unstable_flushAll();
    root.render(<StrictRoot foo={false} />);
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

    const container = document.createElement('div');

    expect(() =>
      ReactDOM.render(<SyncRoot />, container),
    ).toErrorDev(
      'Using UNSAFE_componentWillReceiveProps in strict mode is not recommended',
      {withoutStack: true},
    );

    // Dedupe
    ReactDOM.render(<SyncRoot />, container);
  });
});

describe('symbol checks', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
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

    const container = document.createElement('div');
    ReactDOM.render(<ParentComponent useFragment={false} />, container);
    expect(container.textContent).toBe('count:1');
    ReactDOM.render(<ParentComponent useFragment={true} />, container);
    expect(container.textContent).toBe('count:1');
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

    const container = document.createElement('div');
    ReactDOM.render(<ParentComponent useFragment={true} />, container);
    expect(container.textContent).toBe('count:1');
    ReactDOM.render(<ParentComponent useFragment={false} />, container);
    expect(container.textContent).toBe('count:1');
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

    const container = document.createElement('div');
    ReactDOM.render(<ParentComponent />, container);
    expect(container.textContent).toBe('count:1');
    ReactDOM.render(<ParentComponent />, container);
    expect(container.textContent).toBe('count:2');
  });
});

describe('string refs', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
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

    const container = document.createElement('div');
    expect(() => {
      ReactDOM.render(<OuterComponent />, container);
    }).toErrorDev(
      'Warning: A string ref, "somestring", has been found within a strict mode tree. ' +
        'String refs are a source of potential bugs and should be avoided. ' +
        'We recommend using useRef() or createRef() instead. ' +
        'Learn more about using refs safely here: ' +
        'https://reactjs.org/link/strict-mode-string-ref\n' +
        '    in OuterComponent (at **)',
    );

    // Dedup
    ReactDOM.render(<OuterComponent />, container);
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

    const container = document.createElement('div');
    expect(() => {
      ReactDOM.render(<OuterComponent />, container);
    }).toErrorDev(
      'Warning: A string ref, "somestring", has been found within a strict mode tree. ' +
        'String refs are a source of potential bugs and should be avoided. ' +
        'We recommend using useRef() or createRef() instead. ' +
        'Learn more about using refs safely here: ' +
        'https://reactjs.org/link/strict-mode-string-ref\n' +
        '    in InnerComponent (at **)\n' +
        '    in OuterComponent (at **)',
    );

    // Dedup
    ReactDOM.render(<OuterComponent />, container);
  });
});

describe('context legacy', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
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

    const container = document.createElement('div');
    expect(() => {
      ReactDOM.render(<Root />, container);
    }).toErrorDev(
      'Warning: Legacy context API has been detected within a strict-mode tree.' +
        '\n\nThe old API will be supported in all 16.x releases, but applications ' +
        'using it should migrate to the new version.' +
        '\n\nPlease update the following components: ' +
        'FunctionalLegacyContextConsumer, LegacyContextConsumer, LegacyContextProvider' +
        '\n\nLearn more about this warning here: ' +
        'https://reactjs.org/link/legacy-context' +
        '\n    in LegacyContextProvider (at **)' +
        '\n    in div (at **)' +
        '\n    in Root (at **)',
    );

    // Dedupe
    ReactDOM.render(<Root />, container);
  });

  describe('console logs logging', () => {
    beforeEach(() => {
      jest.resetModules();
      React = require('react');
      ReactDOM = require('react-dom');
    });

    if (ReactFeatureFlags.consoleManagedByDevToolsDuringStrictMode) {
      it('does not disable logs for class double render', () => {
        spyOnDevAndProd(console, 'log');

        let count = 0;
        class Foo extends React.Component {
          render() {
            count++;
            console.log('foo ' + count);
            return null;
          }
        }

        const container = document.createElement('div');
        ReactDOM.render(
          <React.StrictMode>
            <Foo />
          </React.StrictMode>,
          container,
        );

        expect(count).toBe(__DEV__ ? 2 : 1);
        expect(console.log).toBeCalledTimes(__DEV__ ? 2 : 1);
        // Note: we should display the first log because otherwise
        // there is a risk of suppressing warnings when they happen,
        // and on the next render they'd get deduplicated and ignored.
        expect(console.log).toBeCalledWith('foo 1');
      });

      it('does not disable logs for class double ctor', () => {
        spyOnDevAndProd(console, 'log');

        let count = 0;
        class Foo extends React.Component {
          constructor(props) {
            super(props);
            count++;
            console.log('foo ' + count);
          }
          render() {
            return null;
          }
        }

        const container = document.createElement('div');
        ReactDOM.render(
          <React.StrictMode>
            <Foo />
          </React.StrictMode>,
          container,
        );

        expect(count).toBe(__DEV__ ? 2 : 1);
        expect(console.log).toBeCalledTimes(__DEV__ ? 2 : 1);
        // Note: we should display the first log because otherwise
        // there is a risk of suppressing warnings when they happen,
        // and on the next render they'd get deduplicated and ignored.
        expect(console.log).toBeCalledWith('foo 1');
      });

      it('does not disable logs for class double getDerivedStateFromProps', () => {
        spyOnDevAndProd(console, 'log');

        let count = 0;
        class Foo extends React.Component {
          state = {};
          static getDerivedStateFromProps() {
            count++;
            console.log('foo ' + count);
            return {};
          }
          render() {
            return null;
          }
        }

        const container = document.createElement('div');
        ReactDOM.render(
          <React.StrictMode>
            <Foo />
          </React.StrictMode>,
          container,
        );

        expect(count).toBe(__DEV__ ? 2 : 1);
        expect(console.log).toBeCalledTimes(__DEV__ ? 2 : 1);
        // Note: we should display the first log because otherwise
        // there is a risk of suppressing warnings when they happen,
        // and on the next render they'd get deduplicated and ignored.
        expect(console.log).toBeCalledWith('foo 1');
      });

      it('does not disable logs for class double shouldComponentUpdate', () => {
        spyOnDevAndProd(console, 'log');

        let count = 0;
        class Foo extends React.Component {
          state = {};
          shouldComponentUpdate() {
            count++;
            console.log('foo ' + count);
            return {};
          }
          render() {
            return null;
          }
        }

        const container = document.createElement('div');
        ReactDOM.render(
          <React.StrictMode>
            <Foo />
          </React.StrictMode>,
          container,
        );
        // Trigger sCU:
        ReactDOM.render(
          <React.StrictMode>
            <Foo />
          </React.StrictMode>,
          container,
        );

        expect(count).toBe(__DEV__ ? 2 : 1);
        expect(console.log).toBeCalledTimes(__DEV__ ? 2 : 1);
        // Note: we should display the first log because otherwise
        // there is a risk of suppressing warnings when they happen,
        // and on the next render they'd get deduplicated and ignored.
        expect(console.log).toBeCalledWith('foo 1');
      });

      it('does not disable logs for class state updaters', () => {
        spyOnDevAndProd(console, 'log');

        let inst;
        let count = 0;
        class Foo extends React.Component {
          state = {};
          render() {
            inst = this;
            return null;
          }
        }

        const container = document.createElement('div');
        ReactDOM.render(
          <React.StrictMode>
            <Foo />
          </React.StrictMode>,
          container,
        );
        inst.setState(() => {
          count++;
          console.log('foo ' + count);
          return {};
        });

        expect(count).toBe(__DEV__ ? 2 : 1);
        expect(console.log).toBeCalledTimes(__DEV__ ? 2 : 1);
        // Note: we should display the first log because otherwise
        // there is a risk of suppressing warnings when they happen,
        // and on the next render they'd get deduplicated and ignored.
        expect(console.log).toBeCalledWith('foo 1');
      });

      it('does not disable logs for function double render', () => {
        spyOnDevAndProd(console, 'log');

        let count = 0;
        function Foo() {
          count++;
          console.log('foo ' + count);
          return null;
        }

        const container = document.createElement('div');
        ReactDOM.render(
          <React.StrictMode>
            <Foo />
          </React.StrictMode>,
          container,
        );

        expect(count).toBe(__DEV__ ? 2 : 1);
        expect(console.log).toBeCalledTimes(__DEV__ ? 2 : 1);
        // Note: we should display the first log because otherwise
        // there is a risk of suppressing warnings when they happen,
        // and on the next render they'd get deduplicated and ignored.
        expect(console.log).toBeCalledWith('foo 1');
      });
    } else {
      it('disable logs for class double render', () => {
        spyOnDevAndProd(console, 'log');

        let count = 0;
        class Foo extends React.Component {
          render() {
            count++;
            console.log('foo ' + count);
            return null;
          }
        }

        const container = document.createElement('div');
        ReactDOM.render(
          <React.StrictMode>
            <Foo />
          </React.StrictMode>,
          container,
        );

        expect(count).toBe(__DEV__ ? 2 : 1);
        expect(console.log).toBeCalledTimes(1);
        // Note: we should display the first log because otherwise
        // there is a risk of suppressing warnings when they happen,
        // and on the next render they'd get deduplicated and ignored.
        expect(console.log).toBeCalledWith('foo 1');
      });

      it('disables logs for class double ctor', () => {
        spyOnDevAndProd(console, 'log');

        let count = 0;
        class Foo extends React.Component {
          constructor(props) {
            super(props);
            count++;
            console.log('foo ' + count);
          }
          render() {
            return null;
          }
        }

        const container = document.createElement('div');
        ReactDOM.render(
          <React.StrictMode>
            <Foo />
          </React.StrictMode>,
          container,
        );

        expect(count).toBe(__DEV__ ? 2 : 1);
        expect(console.log).toBeCalledTimes(1);
        // Note: we should display the first log because otherwise
        // there is a risk of suppressing warnings when they happen,
        // and on the next render they'd get deduplicated and ignored.
        expect(console.log).toBeCalledWith('foo 1');
      });

      it('disable logs for class double getDerivedStateFromProps', () => {
        spyOnDevAndProd(console, 'log');

        let count = 0;
        class Foo extends React.Component {
          state = {};
          static getDerivedStateFromProps() {
            count++;
            console.log('foo ' + count);
            return {};
          }
          render() {
            return null;
          }
        }

        const container = document.createElement('div');
        ReactDOM.render(
          <React.StrictMode>
            <Foo />
          </React.StrictMode>,
          container,
        );

        expect(count).toBe(__DEV__ ? 2 : 1);
        expect(console.log).toBeCalledTimes(1);
        // Note: we should display the first log because otherwise
        // there is a risk of suppressing warnings when they happen,
        // and on the next render they'd get deduplicated and ignored.
        expect(console.log).toBeCalledWith('foo 1');
      });

      it('disable logs for class double shouldComponentUpdate', () => {
        spyOnDevAndProd(console, 'log');

        let count = 0;
        class Foo extends React.Component {
          state = {};
          shouldComponentUpdate() {
            count++;
            console.log('foo ' + count);
            return {};
          }
          render() {
            return null;
          }
        }

        const container = document.createElement('div');
        ReactDOM.render(
          <React.StrictMode>
            <Foo />
          </React.StrictMode>,
          container,
        );
        // Trigger sCU:
        ReactDOM.render(
          <React.StrictMode>
            <Foo />
          </React.StrictMode>,
          container,
        );

        expect(count).toBe(__DEV__ ? 2 : 1);
        expect(console.log).toBeCalledTimes(1);
        // Note: we should display the first log because otherwise
        // there is a risk of suppressing warnings when they happen,
        // and on the next render they'd get deduplicated and ignored.
        expect(console.log).toBeCalledWith('foo 1');
      });

      it('disable logs for class state updaters', () => {
        spyOnDevAndProd(console, 'log');

        let inst;
        let count = 0;
        class Foo extends React.Component {
          state = {};
          render() {
            inst = this;
            return null;
          }
        }

        const container = document.createElement('div');
        ReactDOM.render(
          <React.StrictMode>
            <Foo />
          </React.StrictMode>,
          container,
        );
        inst.setState(() => {
          count++;
          console.log('foo ' + count);
          return {};
        });

        expect(count).toBe(__DEV__ ? 2 : 1);
        expect(console.log).toBeCalledTimes(1);
        // Note: we should display the first log because otherwise
        // there is a risk of suppressing warnings when they happen,
        // and on the next render they'd get deduplicated and ignored.
        expect(console.log).toBeCalledWith('foo 1');
      });

      it('disable logs for function double render', () => {
        spyOnDevAndProd(console, 'log');

        let count = 0;
        function Foo() {
          count++;
          console.log('foo ' + count);
          return null;
        }

        const container = document.createElement('div');
        ReactDOM.render(
          <React.StrictMode>
            <Foo />
          </React.StrictMode>,
          container,
        );

        expect(count).toBe(__DEV__ ? 2 : 1);
        expect(console.log).toBeCalledTimes(1);
        // Note: we should display the first log because otherwise
        // there is a risk of suppressing warnings when they happen,
        // and on the next render they'd get deduplicated and ignored.
        expect(console.log).toBeCalledWith('foo 1');
      });
    }
  });
});
