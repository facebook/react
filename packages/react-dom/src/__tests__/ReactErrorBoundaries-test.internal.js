/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let PropTypes;
let React;
let ReactDOM;
let act;
let ReactFeatureFlags;
let Scheduler;

describe('ReactErrorBoundaries', () => {
  let BrokenConstructor;
  let BrokenComponentWillMount;
  let BrokenComponentDidMount;
  let BrokenComponentWillReceiveProps;
  let BrokenComponentWillUpdate;
  let BrokenComponentDidUpdate;
  let BrokenComponentWillUnmount;
  let BrokenRenderErrorBoundary;
  let BrokenComponentWillMountErrorBoundary;
  let BrokenComponentDidMountErrorBoundary;
  let BrokenRender;
  let BrokenUseEffect;
  let BrokenUseLayoutEffect;
  let ErrorBoundary;
  let ErrorMessage;
  let NoopErrorBoundary;
  let RetryErrorBoundary;
  let Normal;
  let assertLog;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
    PropTypes = require('prop-types');
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    ReactDOM = require('react-dom');
    React = require('react');
    act = require('internal-test-utils').act;
    Scheduler = require('scheduler');

    const InternalTestUtils = require('internal-test-utils');
    assertLog = InternalTestUtils.assertLog;

    BrokenConstructor = class extends React.Component {
      constructor(props) {
        super(props);
        Scheduler.log('BrokenConstructor constructor [!]');
        throw new Error('Hello');
      }
      render() {
        Scheduler.log('BrokenConstructor render');
        return <div>{this.props.children}</div>;
      }
      UNSAFE_componentWillMount() {
        Scheduler.log('BrokenConstructor componentWillMount');
      }
      componentDidMount() {
        Scheduler.log('BrokenConstructor componentDidMount');
      }
      UNSAFE_componentWillReceiveProps() {
        Scheduler.log('BrokenConstructor componentWillReceiveProps');
      }
      UNSAFE_componentWillUpdate() {
        Scheduler.log('BrokenConstructor componentWillUpdate');
      }
      componentDidUpdate() {
        Scheduler.log('BrokenConstructor componentDidUpdate');
      }
      componentWillUnmount() {
        Scheduler.log('BrokenConstructor componentWillUnmount');
      }
    };

    BrokenComponentWillMount = class extends React.Component {
      constructor(props) {
        super(props);
        Scheduler.log('BrokenComponentWillMount constructor');
      }
      render() {
        Scheduler.log('BrokenComponentWillMount render');
        return <div>{this.props.children}</div>;
      }
      UNSAFE_componentWillMount() {
        Scheduler.log('BrokenComponentWillMount componentWillMount [!]');
        throw new Error('Hello');
      }
      componentDidMount() {
        Scheduler.log('BrokenComponentWillMount componentDidMount');
      }
      UNSAFE_componentWillReceiveProps() {
        Scheduler.log('BrokenComponentWillMount componentWillReceiveProps');
      }
      UNSAFE_componentWillUpdate() {
        Scheduler.log('BrokenComponentWillMount componentWillUpdate');
      }
      componentDidUpdate() {
        Scheduler.log('BrokenComponentWillMount componentDidUpdate');
      }
      componentWillUnmount() {
        Scheduler.log('BrokenComponentWillMount componentWillUnmount');
      }
    };

    BrokenComponentDidMount = class extends React.Component {
      constructor(props) {
        super(props);
        Scheduler.log('BrokenComponentDidMount constructor');
      }
      render() {
        Scheduler.log('BrokenComponentDidMount render');
        return <div>{this.props.children}</div>;
      }
      UNSAFE_componentWillMount() {
        Scheduler.log('BrokenComponentDidMount componentWillMount');
      }
      componentDidMount() {
        Scheduler.log('BrokenComponentDidMount componentDidMount [!]');
        throw new Error('Hello');
      }
      UNSAFE_componentWillReceiveProps() {
        Scheduler.log('BrokenComponentDidMount componentWillReceiveProps');
      }
      UNSAFE_componentWillUpdate() {
        Scheduler.log('BrokenComponentDidMount componentWillUpdate');
      }
      componentDidUpdate() {
        Scheduler.log('BrokenComponentDidMount componentDidUpdate');
      }
      componentWillUnmount() {
        Scheduler.log('BrokenComponentDidMount componentWillUnmount');
      }
    };

    BrokenComponentWillReceiveProps = class extends React.Component {
      constructor(props) {
        super(props);
        Scheduler.log('BrokenComponentWillReceiveProps constructor');
      }
      render() {
        Scheduler.log('BrokenComponentWillReceiveProps render');
        return <div>{this.props.children}</div>;
      }
      UNSAFE_componentWillMount() {
        Scheduler.log('BrokenComponentWillReceiveProps componentWillMount');
      }
      componentDidMount() {
        Scheduler.log('BrokenComponentWillReceiveProps componentDidMount');
      }
      UNSAFE_componentWillReceiveProps() {
        Scheduler.log(
          'BrokenComponentWillReceiveProps componentWillReceiveProps [!]',
        );
        throw new Error('Hello');
      }
      UNSAFE_componentWillUpdate() {
        Scheduler.log('BrokenComponentWillReceiveProps componentWillUpdate');
      }
      componentDidUpdate() {
        Scheduler.log('BrokenComponentWillReceiveProps componentDidUpdate');
      }
      componentWillUnmount() {
        Scheduler.log('BrokenComponentWillReceiveProps componentWillUnmount');
      }
    };

    BrokenComponentWillUpdate = class extends React.Component {
      constructor(props) {
        super(props);
        Scheduler.log('BrokenComponentWillUpdate constructor');
      }
      render() {
        Scheduler.log('BrokenComponentWillUpdate render');
        return <div>{this.props.children}</div>;
      }
      UNSAFE_componentWillMount() {
        Scheduler.log('BrokenComponentWillUpdate componentWillMount');
      }
      componentDidMount() {
        Scheduler.log('BrokenComponentWillUpdate componentDidMount');
      }
      UNSAFE_componentWillReceiveProps() {
        Scheduler.log('BrokenComponentWillUpdate componentWillReceiveProps');
      }
      UNSAFE_componentWillUpdate() {
        Scheduler.log('BrokenComponentWillUpdate componentWillUpdate [!]');
        throw new Error('Hello');
      }
      componentDidUpdate() {
        Scheduler.log('BrokenComponentWillUpdate componentDidUpdate');
      }
      componentWillUnmount() {
        Scheduler.log('BrokenComponentWillUpdate componentWillUnmount');
      }
    };

    BrokenComponentDidUpdate = class extends React.Component {
      static defaultProps = {
        errorText: 'Hello',
      };
      constructor(props) {
        super(props);
        Scheduler.log('BrokenComponentDidUpdate constructor');
      }
      render() {
        Scheduler.log('BrokenComponentDidUpdate render');
        return <div>{this.props.children}</div>;
      }
      UNSAFE_componentWillMount() {
        Scheduler.log('BrokenComponentDidUpdate componentWillMount');
      }
      componentDidMount() {
        Scheduler.log('BrokenComponentDidUpdate componentDidMount');
      }
      UNSAFE_componentWillReceiveProps() {
        Scheduler.log('BrokenComponentDidUpdate componentWillReceiveProps');
      }
      UNSAFE_componentWillUpdate() {
        Scheduler.log('BrokenComponentDidUpdate componentWillUpdate');
      }
      componentDidUpdate() {
        Scheduler.log('BrokenComponentDidUpdate componentDidUpdate [!]');
        throw new Error(this.props.errorText);
      }
      componentWillUnmount() {
        Scheduler.log('BrokenComponentDidUpdate componentWillUnmount');
      }
    };

    BrokenComponentWillUnmount = class extends React.Component {
      static defaultProps = {
        errorText: 'Hello',
      };
      constructor(props) {
        super(props);
        Scheduler.log('BrokenComponentWillUnmount constructor');
      }
      render() {
        Scheduler.log('BrokenComponentWillUnmount render');
        return <div>{this.props.children}</div>;
      }
      UNSAFE_componentWillMount() {
        Scheduler.log('BrokenComponentWillUnmount componentWillMount');
      }
      componentDidMount() {
        Scheduler.log('BrokenComponentWillUnmount componentDidMount');
      }
      UNSAFE_componentWillReceiveProps() {
        Scheduler.log('BrokenComponentWillUnmount componentWillReceiveProps');
      }
      UNSAFE_componentWillUpdate() {
        Scheduler.log('BrokenComponentWillUnmount componentWillUpdate');
      }
      componentDidUpdate() {
        Scheduler.log('BrokenComponentWillUnmount componentDidUpdate');
      }
      componentWillUnmount() {
        Scheduler.log('BrokenComponentWillUnmount componentWillUnmount [!]');
        throw new Error(this.props.errorText);
      }
    };

    BrokenComponentWillMountErrorBoundary = class extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: null};
        Scheduler.log('BrokenComponentWillMountErrorBoundary constructor');
      }
      render() {
        if (this.state.error) {
          Scheduler.log('BrokenComponentWillMountErrorBoundary render error');
          return <div>Caught an error: {this.state.error.message}.</div>;
        }
        Scheduler.log('BrokenComponentWillMountErrorBoundary render success');
        return <div>{this.props.children}</div>;
      }
      UNSAFE_componentWillMount() {
        Scheduler.log(
          'BrokenComponentWillMountErrorBoundary componentWillMount [!]',
        );
        throw new Error('Hello');
      }
      componentDidMount() {
        Scheduler.log(
          'BrokenComponentWillMountErrorBoundary componentDidMount',
        );
      }
      componentWillUnmount() {
        Scheduler.log(
          'BrokenComponentWillMountErrorBoundary componentWillUnmount',
        );
      }
      static getDerivedStateFromError(error) {
        Scheduler.log(
          'BrokenComponentWillMountErrorBoundary static getDerivedStateFromError',
        );
        return {error};
      }
    };

    BrokenComponentDidMountErrorBoundary = class extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: null};
        Scheduler.log('BrokenComponentDidMountErrorBoundary constructor');
      }
      render() {
        if (this.state.error) {
          Scheduler.log('BrokenComponentDidMountErrorBoundary render error');
          return <div>Caught an error: {this.state.error.message}.</div>;
        }
        Scheduler.log('BrokenComponentDidMountErrorBoundary render success');
        return <div>{this.props.children}</div>;
      }
      UNSAFE_componentWillMount() {
        Scheduler.log(
          'BrokenComponentDidMountErrorBoundary componentWillMount',
        );
      }
      componentDidMount() {
        Scheduler.log(
          'BrokenComponentDidMountErrorBoundary componentDidMount [!]',
        );
        throw new Error('Hello');
      }
      componentWillUnmount() {
        Scheduler.log(
          'BrokenComponentDidMountErrorBoundary componentWillUnmount',
        );
      }
      static getDerivedStateFromError(error) {
        Scheduler.log(
          'BrokenComponentDidMountErrorBoundary static getDerivedStateFromError',
        );
        return {error};
      }
    };

    BrokenRenderErrorBoundary = class extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: null};
        Scheduler.log('BrokenRenderErrorBoundary constructor');
      }
      render() {
        if (this.state.error) {
          Scheduler.log('BrokenRenderErrorBoundary render error [!]');
          throw new Error('Hello');
        }
        Scheduler.log('BrokenRenderErrorBoundary render success');
        return <div>{this.props.children}</div>;
      }
      UNSAFE_componentWillMount() {
        Scheduler.log('BrokenRenderErrorBoundary componentWillMount');
      }
      componentDidMount() {
        Scheduler.log('BrokenRenderErrorBoundary componentDidMount');
      }
      componentWillUnmount() {
        Scheduler.log('BrokenRenderErrorBoundary componentWillUnmount');
      }
      static getDerivedStateFromError(error) {
        Scheduler.log(
          'BrokenRenderErrorBoundary static getDerivedStateFromError',
        );
        return {error};
      }
    };

    BrokenRender = class extends React.Component {
      constructor(props) {
        super(props);
        Scheduler.log('BrokenRender constructor');
      }
      render() {
        Scheduler.log('BrokenRender render [!]');
        throw new Error('Hello');
      }
      UNSAFE_componentWillMount() {
        Scheduler.log('BrokenRender componentWillMount');
      }
      componentDidMount() {
        Scheduler.log('BrokenRender componentDidMount');
      }
      UNSAFE_componentWillReceiveProps() {
        Scheduler.log('BrokenRender componentWillReceiveProps');
      }
      UNSAFE_componentWillUpdate() {
        Scheduler.log('BrokenRender componentWillUpdate');
      }
      componentDidUpdate() {
        Scheduler.log('BrokenRender componentDidUpdate');
      }
      componentWillUnmount() {
        Scheduler.log('BrokenRender componentWillUnmount');
      }
    };

    BrokenUseEffect = ({children}) => {
      Scheduler.log('BrokenUseEffect render');

      React.useEffect(() => {
        Scheduler.log('BrokenUseEffect useEffect [!]');
        throw new Error('Hello');
      });

      return children;
    };

    BrokenUseLayoutEffect = ({children}) => {
      Scheduler.log('BrokenUseLayoutEffect render');

      React.useLayoutEffect(() => {
        Scheduler.log('BrokenUseLayoutEffect useLayoutEffect [!]');
        throw new Error('Hello');
      });

      return children;
    };

    NoopErrorBoundary = class extends React.Component {
      constructor(props) {
        super(props);
        Scheduler.log('NoopErrorBoundary constructor');
      }
      render() {
        Scheduler.log('NoopErrorBoundary render');
        return <BrokenRender />;
      }
      UNSAFE_componentWillMount() {
        Scheduler.log('NoopErrorBoundary componentWillMount');
      }
      componentDidMount() {
        Scheduler.log('NoopErrorBoundary componentDidMount');
      }
      componentWillUnmount() {
        Scheduler.log('NoopErrorBoundary componentWillUnmount');
      }
      static getDerivedStateFromError() {
        Scheduler.log('NoopErrorBoundary static getDerivedStateFromError');
      }
    };

    Normal = class extends React.Component {
      static defaultProps = {
        logName: 'Normal',
      };
      constructor(props) {
        super(props);
        Scheduler.log(`${this.props.logName} constructor`);
      }
      render() {
        Scheduler.log(`${this.props.logName} render`);
        return <div>{this.props.children}</div>;
      }
      UNSAFE_componentWillMount() {
        Scheduler.log(`${this.props.logName} componentWillMount`);
      }
      componentDidMount() {
        Scheduler.log(`${this.props.logName} componentDidMount`);
      }
      UNSAFE_componentWillReceiveProps() {
        Scheduler.log(`${this.props.logName} componentWillReceiveProps`);
      }
      UNSAFE_componentWillUpdate() {
        Scheduler.log(`${this.props.logName} componentWillUpdate`);
      }
      componentDidUpdate() {
        Scheduler.log(`${this.props.logName} componentDidUpdate`);
      }
      componentWillUnmount() {
        Scheduler.log(`${this.props.logName} componentWillUnmount`);
      }
    };

    ErrorBoundary = class extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: null};
        Scheduler.log(`${this.props.logName} constructor`);
      }
      render() {
        if (this.state.error && !this.props.forceRetry) {
          Scheduler.log(`${this.props.logName} render error`);
          return this.props.renderError(this.state.error, this.props);
        }
        Scheduler.log(`${this.props.logName} render success`);
        return <div>{this.props.children}</div>;
      }
      static getDerivedStateFromError(error) {
        Scheduler.log('ErrorBoundary static getDerivedStateFromError');
        return {error};
      }
      UNSAFE_componentWillMount() {
        Scheduler.log(`${this.props.logName} componentWillMount`);
      }
      componentDidMount() {
        Scheduler.log(`${this.props.logName} componentDidMount`);
      }
      UNSAFE_componentWillReceiveProps() {
        Scheduler.log(`${this.props.logName} componentWillReceiveProps`);
      }
      UNSAFE_componentWillUpdate() {
        Scheduler.log(`${this.props.logName} componentWillUpdate`);
      }
      componentDidUpdate() {
        Scheduler.log(`${this.props.logName} componentDidUpdate`);
      }
      componentWillUnmount() {
        Scheduler.log(`${this.props.logName} componentWillUnmount`);
      }
    };
    ErrorBoundary.defaultProps = {
      logName: 'ErrorBoundary',
      renderError(error, props) {
        return (
          <div ref={props.errorMessageRef}>
            Caught an error: {error.message}.
          </div>
        );
      },
    };

    RetryErrorBoundary = class extends React.Component {
      constructor(props) {
        super(props);
        Scheduler.log('RetryErrorBoundary constructor');
      }
      render() {
        Scheduler.log('RetryErrorBoundary render');
        return <BrokenRender />;
      }
      UNSAFE_componentWillMount() {
        Scheduler.log('RetryErrorBoundary componentWillMount');
      }
      componentDidMount() {
        Scheduler.log('RetryErrorBoundary componentDidMount');
      }
      componentWillUnmount() {
        Scheduler.log('RetryErrorBoundary componentWillUnmount');
      }
      static getDerivedStateFromError(error) {
        Scheduler.log('RetryErrorBoundary static getDerivedStateFromError [!]');
        // In Fiber, calling setState() (and failing) is treated as a rethrow.
        return {};
      }
    };

    ErrorMessage = class extends React.Component {
      constructor(props) {
        super(props);
        Scheduler.log('ErrorMessage constructor');
      }
      UNSAFE_componentWillMount() {
        Scheduler.log('ErrorMessage componentWillMount');
      }
      componentDidMount() {
        Scheduler.log('ErrorMessage componentDidMount');
      }
      componentWillUnmount() {
        Scheduler.log('ErrorMessage componentWillUnmount');
      }
      render() {
        Scheduler.log('ErrorMessage render');
        return <div>Caught an error: {this.props.message}.</div>;
      }
    };
  });

  it('does not swallow exceptions on mounting without boundaries', () => {
    let container = document.createElement('div');
    expect(() => {
      ReactDOM.render(<BrokenRender />, container);
    }).toThrow('Hello');

    container = document.createElement('div');
    expect(() => {
      ReactDOM.render(<BrokenComponentWillMount />, container);
    }).toThrow('Hello');

    container = document.createElement('div');
    expect(() => {
      ReactDOM.render(<BrokenComponentDidMount />, container);
    }).toThrow('Hello');
  });

  it('does not swallow exceptions on updating without boundaries', () => {
    let container = document.createElement('div');
    ReactDOM.render(<BrokenComponentWillUpdate />, container);
    expect(() => {
      ReactDOM.render(<BrokenComponentWillUpdate />, container);
    }).toThrow('Hello');

    container = document.createElement('div');
    ReactDOM.render(<BrokenComponentWillReceiveProps />, container);
    expect(() => {
      ReactDOM.render(<BrokenComponentWillReceiveProps />, container);
    }).toThrow('Hello');

    container = document.createElement('div');
    ReactDOM.render(<BrokenComponentDidUpdate />, container);
    expect(() => {
      ReactDOM.render(<BrokenComponentDidUpdate />, container);
    }).toThrow('Hello');
  });

  it('does not swallow exceptions on unmounting without boundaries', () => {
    const container = document.createElement('div');
    ReactDOM.render(<BrokenComponentWillUnmount />, container);
    expect(() => {
      ReactDOM.unmountComponentAtNode(container);
    }).toThrow('Hello');
  });

  it('prevents errors from leaking into other roots', () => {
    const container1 = document.createElement('div');
    const container2 = document.createElement('div');
    const container3 = document.createElement('div');

    ReactDOM.render(<span>Before 1</span>, container1);
    expect(() => {
      ReactDOM.render(<BrokenRender />, container2);
    }).toThrow('Hello');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenRender />
      </ErrorBoundary>,
      container3,
    );
    expect(container1.firstChild.textContent).toBe('Before 1');
    expect(container2.firstChild).toBe(null);
    expect(container3.firstChild.textContent).toBe('Caught an error: Hello.');

    ReactDOM.render(<span>After 1</span>, container1);
    ReactDOM.render(<span>After 2</span>, container2);
    ReactDOM.render(
      <ErrorBoundary forceRetry={true}>After 3</ErrorBoundary>,
      container3,
    );
    expect(container1.firstChild.textContent).toBe('After 1');
    expect(container2.firstChild.textContent).toBe('After 2');
    expect(container3.firstChild.textContent).toBe('After 3');

    ReactDOM.unmountComponentAtNode(container1);
    ReactDOM.unmountComponentAtNode(container2);
    ReactDOM.unmountComponentAtNode(container3);
    expect(container1.firstChild).toBe(null);
    expect(container2.firstChild).toBe(null);
    expect(container3.firstChild).toBe(null);
  });

  it('logs a single error when using error boundary', () => {
    const container = document.createElement('div');
    spyOnDev(console, 'error');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenRender />
      </ErrorBoundary>,
      container,
    );
    if (__DEV__) {
      expect(console.error).toHaveBeenCalledTimes(2);
      expect(console.error.mock.calls[0][0]).toContain(
        'ReactDOM.render is no longer supported',
      );
      expect(console.error.mock.calls[1][0]).toContain(
        'The above error occurred in the <BrokenRender> component:',
      );
    }

    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
    assertLog([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      // Catch and render an error message
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render error',
      'ErrorBoundary componentDidMount',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it('renders an error state if child throws in render', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenRender />
      </ErrorBoundary>,
      container,
    );
    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
    assertLog([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      // Catch and render an error message
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render error',
      'ErrorBoundary componentDidMount',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it('renders an error state if child throws in constructor', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenConstructor />
      </ErrorBoundary>,
      container,
    );
    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
    assertLog([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenConstructor constructor [!]',
      // Catch and render an error message
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render error',
      'ErrorBoundary componentDidMount',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it('renders an error state if child throws in componentWillMount', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenComponentWillMount />
      </ErrorBoundary>,
      container,
    );
    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
    assertLog([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenComponentWillMount constructor',
      'BrokenComponentWillMount componentWillMount [!]',
      // Catch and render an error message
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render error',
      'ErrorBoundary componentDidMount',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  // @gate !disableLegacyContext || !__DEV__
  it('renders an error state if context provider throws in componentWillMount', () => {
    class BrokenComponentWillMountWithContext extends React.Component {
      static childContextTypes = {foo: PropTypes.number};
      getChildContext() {
        return {foo: 42};
      }
      render() {
        return <div>{this.props.children}</div>;
      }
      UNSAFE_componentWillMount() {
        throw new Error('Hello');
      }
    }

    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenComponentWillMountWithContext />
      </ErrorBoundary>,
      container,
    );
    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
  });

  // @gate !disableModulePatternComponents
  // @gate !disableLegacyContext
  it('renders an error state if module-style context provider throws in componentWillMount', () => {
    function BrokenComponentWillMountWithContext() {
      return {
        getChildContext() {
          return {foo: 42};
        },
        render() {
          return <div>{this.props.children}</div>;
        },
        UNSAFE_componentWillMount() {
          throw new Error('Hello');
        },
      };
    }
    BrokenComponentWillMountWithContext.childContextTypes = {
      foo: PropTypes.number,
    };

    const container = document.createElement('div');
    expect(() =>
      ReactDOM.render(
        <ErrorBoundary>
          <BrokenComponentWillMountWithContext />
        </ErrorBoundary>,
        container,
      ),
    ).toErrorDev(
      'Warning: The <BrokenComponentWillMountWithContext /> component appears to be a function component that ' +
        'returns a class instance. ' +
        'Change BrokenComponentWillMountWithContext to a class that extends React.Component instead. ' +
        "If you can't use a class try assigning the prototype on the function as a workaround. " +
        '`BrokenComponentWillMountWithContext.prototype = React.Component.prototype`. ' +
        "Don't use an arrow function since it cannot be called with `new` by React.",
    );

    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
  });

  it('mounts the error message if mounting fails', () => {
    function renderError(error) {
      return <ErrorMessage message={error.message} />;
    }

    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary renderError={renderError}>
        <BrokenRender />
      </ErrorBoundary>,
      container,
    );
    assertLog([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render error',
      'ErrorMessage constructor',
      'ErrorMessage componentWillMount',
      'ErrorMessage render',
      'ErrorMessage componentDidMount',
      'ErrorBoundary componentDidMount',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog([
      'ErrorBoundary componentWillUnmount',
      'ErrorMessage componentWillUnmount',
    ]);
  });

  it('propagates errors on retry on mounting', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <RetryErrorBoundary>
          <BrokenRender />
        </RetryErrorBoundary>
      </ErrorBoundary>,
      container,
    );
    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
    assertLog([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'RetryErrorBoundary constructor',
      'RetryErrorBoundary componentWillMount',
      'RetryErrorBoundary render',
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      // Retry
      'RetryErrorBoundary static getDerivedStateFromError [!]',
      'RetryErrorBoundary componentWillMount',
      'RetryErrorBoundary render',
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      // This time, the error propagates to the higher boundary
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render error',
      'ErrorBoundary componentDidMount',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it('propagates errors inside boundary during componentWillMount', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenComponentWillMountErrorBoundary />
      </ErrorBoundary>,
      container,
    );
    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
    assertLog([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenComponentWillMountErrorBoundary constructor',
      'BrokenComponentWillMountErrorBoundary componentWillMount [!]',
      // The error propagates to the higher boundary
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render error',
      'ErrorBoundary componentDidMount',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it('propagates errors inside boundary while rendering error state', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenRenderErrorBoundary>
          <BrokenRender />
        </BrokenRenderErrorBoundary>
      </ErrorBoundary>,
      container,
    );
    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
    assertLog([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenRenderErrorBoundary constructor',
      'BrokenRenderErrorBoundary componentWillMount',
      'BrokenRenderErrorBoundary render success',
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      // Attempt to handle the error
      'BrokenRenderErrorBoundary static getDerivedStateFromError',
      'BrokenRenderErrorBoundary componentWillMount',
      'BrokenRenderErrorBoundary render error [!]',
      // Attempt to handle the error again
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render error',
      'ErrorBoundary componentDidMount',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it('does not call componentWillUnmount when aborting initial mount', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <BrokenRender />
        <Normal />
      </ErrorBoundary>,
      container,
    );
    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
    assertLog([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      // Render first child
      'Normal constructor',
      'Normal componentWillMount',
      'Normal render',
      // Render second child (it throws)
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      // Skip the remaining siblings
      // Handle the error
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render error',
      'ErrorBoundary componentDidMount',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it('resets callback refs if mounting aborts', () => {
    function childRef(x) {
      Scheduler.log('Child ref is set to ' + x);
    }
    function errorMessageRef(x) {
      Scheduler.log('Error message ref is set to ' + x);
    }

    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary errorMessageRef={errorMessageRef}>
        <div ref={childRef} />
        <BrokenRender />
      </ErrorBoundary>,
      container,
    );
    expect(container.textContent).toBe('Caught an error: Hello.');
    assertLog([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      // Handle the error
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render error',
      'Error message ref is set to [object HTMLDivElement]',
      'ErrorBoundary componentDidMount',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog([
      'ErrorBoundary componentWillUnmount',
      'Error message ref is set to null',
    ]);
  });

  it('resets object refs if mounting aborts', () => {
    const childRef = React.createRef();
    const errorMessageRef = React.createRef();

    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary errorMessageRef={errorMessageRef}>
        <div ref={childRef} />
        <BrokenRender />
      </ErrorBoundary>,
      container,
    );
    expect(container.textContent).toBe('Caught an error: Hello.');
    assertLog([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      // Handle the error
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render error',
      'ErrorBoundary componentDidMount',
    ]);
    expect(errorMessageRef.current.toString()).toEqual(
      '[object HTMLDivElement]',
    );

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
    expect(errorMessageRef.current).toEqual(null);
  });

  it('successfully mounts if no error occurs', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <div>Mounted successfully.</div>
      </ErrorBoundary>,
      container,
    );
    expect(container.firstChild.textContent).toBe('Mounted successfully.');
    assertLog([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'ErrorBoundary componentDidMount',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it('catches if child throws in constructor during update', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
      </ErrorBoundary>,
      container,
    );
    Scheduler.unstable_clearLog();
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <Normal logName="Normal2" />
        <BrokenConstructor />
      </ErrorBoundary>,
      container,
    );
    expect(container.textContent).toBe('Caught an error: Hello.');
    assertLog([
      'ErrorBoundary componentWillReceiveProps',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render success',
      'Normal componentWillReceiveProps',
      'Normal componentWillUpdate',
      'Normal render',
      // Normal2 will attempt to mount:
      'Normal2 constructor',
      'Normal2 componentWillMount',
      'Normal2 render',
      // BrokenConstructor will abort rendering:
      'BrokenConstructor constructor [!]',
      // Handle the error
      'ErrorBoundary static getDerivedStateFromError',
      // Render the error message
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render error',
      'Normal componentWillUnmount',
      'ErrorBoundary componentDidUpdate',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it('catches if child throws in componentWillMount during update', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
      </ErrorBoundary>,
      container,
    );

    Scheduler.unstable_clearLog();
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <Normal logName="Normal2" />
        <BrokenComponentWillMount />
      </ErrorBoundary>,
      container,
    );
    expect(container.textContent).toBe('Caught an error: Hello.');
    assertLog([
      'ErrorBoundary componentWillReceiveProps',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render success',
      'Normal componentWillReceiveProps',
      'Normal componentWillUpdate',
      'Normal render',
      // Normal2 will attempt to mount:
      'Normal2 constructor',
      'Normal2 componentWillMount',
      'Normal2 render',
      // BrokenComponentWillMount will abort rendering:
      'BrokenComponentWillMount constructor',
      'BrokenComponentWillMount componentWillMount [!]',
      // Handle the error
      'ErrorBoundary static getDerivedStateFromError',
      // Render the error message
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render error',
      'Normal componentWillUnmount',
      'ErrorBoundary componentDidUpdate',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it('catches if child throws in componentWillReceiveProps during update', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <BrokenComponentWillReceiveProps />
      </ErrorBoundary>,
      container,
    );

    Scheduler.unstable_clearLog();
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <BrokenComponentWillReceiveProps />
      </ErrorBoundary>,
      container,
    );
    expect(container.textContent).toBe('Caught an error: Hello.');
    assertLog([
      'ErrorBoundary componentWillReceiveProps',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render success',
      'Normal componentWillReceiveProps',
      'Normal componentWillUpdate',
      'Normal render',
      // BrokenComponentWillReceiveProps will abort rendering:
      'BrokenComponentWillReceiveProps componentWillReceiveProps [!]',
      // Handle the error
      'ErrorBoundary static getDerivedStateFromError',
      // Render the error message
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render error',
      'Normal componentWillUnmount',
      'BrokenComponentWillReceiveProps componentWillUnmount',
      'ErrorBoundary componentDidUpdate',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it('catches if child throws in componentWillUpdate during update', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <BrokenComponentWillUpdate />
      </ErrorBoundary>,
      container,
    );

    Scheduler.unstable_clearLog();
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <BrokenComponentWillUpdate />
      </ErrorBoundary>,
      container,
    );
    expect(container.textContent).toBe('Caught an error: Hello.');
    assertLog([
      'ErrorBoundary componentWillReceiveProps',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render success',
      'Normal componentWillReceiveProps',
      'Normal componentWillUpdate',
      'Normal render',
      // BrokenComponentWillUpdate will abort rendering:
      'BrokenComponentWillUpdate componentWillReceiveProps',
      'BrokenComponentWillUpdate componentWillUpdate [!]',
      // Handle the error
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render error',
      'Normal componentWillUnmount',
      'BrokenComponentWillUpdate componentWillUnmount',
      'ErrorBoundary componentDidUpdate',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it('catches if child throws in render during update', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
      </ErrorBoundary>,
      container,
    );

    Scheduler.unstable_clearLog();
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <Normal logName="Normal2" />
        <BrokenRender />
      </ErrorBoundary>,
      container,
    );
    expect(container.textContent).toBe('Caught an error: Hello.');
    assertLog([
      'ErrorBoundary componentWillReceiveProps',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render success',
      'Normal componentWillReceiveProps',
      'Normal componentWillUpdate',
      'Normal render',
      // Normal2 will attempt to mount:
      'Normal2 constructor',
      'Normal2 componentWillMount',
      'Normal2 render',
      // BrokenRender will abort rendering:
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      // Handle the error
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render error',
      'Normal componentWillUnmount',
      'ErrorBoundary componentDidUpdate',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it('keeps refs up-to-date during updates', () => {
    function child1Ref(x) {
      Scheduler.log('Child1 ref is set to ' + x);
    }
    function child2Ref(x) {
      Scheduler.log('Child2 ref is set to ' + x);
    }
    function errorMessageRef(x) {
      Scheduler.log('Error message ref is set to ' + x);
    }

    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary errorMessageRef={errorMessageRef}>
        <div ref={child1Ref} />
      </ErrorBoundary>,
      container,
    );
    assertLog([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'Child1 ref is set to [object HTMLDivElement]',
      'ErrorBoundary componentDidMount',
    ]);

    ReactDOM.render(
      <ErrorBoundary errorMessageRef={errorMessageRef}>
        <div ref={child1Ref} />
        <div ref={child2Ref} />
        <BrokenRender />
      </ErrorBoundary>,
      container,
    );
    expect(container.textContent).toBe('Caught an error: Hello.');
    assertLog([
      'ErrorBoundary componentWillReceiveProps',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render success',
      // BrokenRender will abort rendering:
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      // Handle the error
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render error',
      // Update Child1 ref since Child1 has been unmounted
      // Child2 ref is never set because its mounting aborted
      'Child1 ref is set to null',
      'Error message ref is set to [object HTMLDivElement]',
      'ErrorBoundary componentDidUpdate',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog([
      'ErrorBoundary componentWillUnmount',
      'Error message ref is set to null',
    ]);
  });

  it('recovers from componentWillUnmount errors on update', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenComponentWillUnmount />
        <BrokenComponentWillUnmount />
        <Normal />
      </ErrorBoundary>,
      container,
    );

    Scheduler.unstable_clearLog();
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenComponentWillUnmount />
      </ErrorBoundary>,
      container,
    );
    expect(container.textContent).toBe('Caught an error: Hello.');
    assertLog([
      'ErrorBoundary componentWillReceiveProps',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render success',
      // Update existing child:
      'BrokenComponentWillUnmount componentWillReceiveProps',
      'BrokenComponentWillUnmount componentWillUpdate',
      'BrokenComponentWillUnmount render',
      // Unmounting throws:
      'BrokenComponentWillUnmount componentWillUnmount [!]',
      // Fiber proceeds with lifecycles despite errors
      'Normal componentWillUnmount',
      // The components have updated in this phase
      'BrokenComponentWillUnmount componentDidUpdate',
      'ErrorBoundary componentDidUpdate',
      // The initial render was aborted, so
      // Fiber retries from the root.
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render error',
      'BrokenComponentWillUnmount componentWillUnmount [!]',
      'ErrorBoundary componentDidUpdate',
      // The second willUnmount error should be captured and logged, too.
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillUpdate',
      // Render an error now (stack will do it later)
      'ErrorBoundary render error',
      // Attempt to unmount previous child:
      // Done
      'ErrorBoundary componentDidUpdate',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it('recovers from nested componentWillUnmount errors on update', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <Normal>
          <BrokenComponentWillUnmount />
        </Normal>
        <BrokenComponentWillUnmount />
      </ErrorBoundary>,
      container,
    );

    Scheduler.unstable_clearLog();
    ReactDOM.render(
      <ErrorBoundary>
        <Normal>
          <BrokenComponentWillUnmount />
        </Normal>
      </ErrorBoundary>,
      container,
    );
    expect(container.textContent).toBe('Caught an error: Hello.');
    assertLog([
      'ErrorBoundary componentWillReceiveProps',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render success',
      // Update existing children:
      'Normal componentWillReceiveProps',
      'Normal componentWillUpdate',
      'Normal render',
      'BrokenComponentWillUnmount componentWillReceiveProps',
      'BrokenComponentWillUnmount componentWillUpdate',
      'BrokenComponentWillUnmount render',
      // Unmounting throws:
      'BrokenComponentWillUnmount componentWillUnmount [!]',
      // Fiber proceeds with lifecycles despite errors
      'BrokenComponentWillUnmount componentDidUpdate',
      'Normal componentDidUpdate',
      'ErrorBoundary componentDidUpdate',
      // Now that commit phase is done, Fiber handles errors
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render error',
      'Normal componentWillUnmount',
      'BrokenComponentWillUnmount componentWillUnmount [!]',
      'ErrorBoundary componentDidUpdate',
      // The second willUnmount error should be captured and logged, too.
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillUpdate',
      // Render an error now (stack will do it later)
      'ErrorBoundary render error',
      // Done
      'ErrorBoundary componentDidUpdate',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it('picks the right boundary when handling unmounting errors', () => {
    function renderInnerError(error) {
      return <div>Caught an inner error: {error.message}.</div>;
    }
    function renderOuterError(error) {
      return <div>Caught an outer error: {error.message}.</div>;
    }

    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary
        logName="OuterErrorBoundary"
        renderError={renderOuterError}>
        <ErrorBoundary
          logName="InnerErrorBoundary"
          renderError={renderInnerError}>
          <BrokenComponentWillUnmount />
        </ErrorBoundary>
      </ErrorBoundary>,
      container,
    );

    Scheduler.unstable_clearLog();
    ReactDOM.render(
      <ErrorBoundary
        logName="OuterErrorBoundary"
        renderError={renderOuterError}>
        <ErrorBoundary
          logName="InnerErrorBoundary"
          renderError={renderInnerError}
        />
      </ErrorBoundary>,
      container,
    );
    expect(container.textContent).toBe('Caught an inner error: Hello.');
    assertLog([
      // Update outer boundary
      'OuterErrorBoundary componentWillReceiveProps',
      'OuterErrorBoundary componentWillUpdate',
      'OuterErrorBoundary render success',
      // Update inner boundary
      'InnerErrorBoundary componentWillReceiveProps',
      'InnerErrorBoundary componentWillUpdate',
      'InnerErrorBoundary render success',
      // Try unmounting child
      'BrokenComponentWillUnmount componentWillUnmount [!]',
      // Now that commit phase is done, Fiber handles errors
      // Only inner boundary receives the error:
      'InnerErrorBoundary componentDidUpdate',
      'OuterErrorBoundary componentDidUpdate',
      'ErrorBoundary static getDerivedStateFromError',
      'InnerErrorBoundary componentWillUpdate',
      // Render an error now
      'InnerErrorBoundary render error',
      // In Fiber, this was a local update to the
      // inner boundary so only its hook fires
      'InnerErrorBoundary componentDidUpdate',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog([
      'OuterErrorBoundary componentWillUnmount',
      'InnerErrorBoundary componentWillUnmount',
    ]);
  });

  it('can recover from error state', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenRender />
      </ErrorBoundary>,
      container,
    );

    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
      </ErrorBoundary>,
      container,
    );
    // Error boundary doesn't retry by itself:
    expect(container.textContent).toBe('Caught an error: Hello.');

    // Force the success path:
    Scheduler.unstable_clearLog();
    ReactDOM.render(
      <ErrorBoundary forceRetry={true}>
        <Normal />
      </ErrorBoundary>,
      container,
    );
    expect(container.textContent).not.toContain('Caught an error');
    assertLog([
      'ErrorBoundary componentWillReceiveProps',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render success',
      // Mount children:
      'Normal constructor',
      'Normal componentWillMount',
      'Normal render',
      // Finalize updates:
      'Normal componentDidMount',
      'ErrorBoundary componentDidUpdate',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog([
      'ErrorBoundary componentWillUnmount',
      'Normal componentWillUnmount',
    ]);
  });

  it('can update multiple times in error state', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenRender />
      </ErrorBoundary>,
      container,
    );
    expect(container.textContent).toBe('Caught an error: Hello.');

    ReactDOM.render(
      <ErrorBoundary>
        <BrokenRender />
      </ErrorBoundary>,
      container,
    );
    expect(container.textContent).toBe('Caught an error: Hello.');

    ReactDOM.render(<div>Other screen</div>, container);
    expect(container.textContent).toBe('Other screen');

    ReactDOM.unmountComponentAtNode(container);
  });

  it("doesn't get into inconsistent state during removals", () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <BrokenComponentWillUnmount />
        <Normal />
      </ErrorBoundary>,
      container,
    );

    ReactDOM.render(<ErrorBoundary />, container);
    expect(container.textContent).toBe('Caught an error: Hello.');

    Scheduler.unstable_clearLog();
    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it("doesn't get into inconsistent state during additions", () => {
    const container = document.createElement('div');
    ReactDOM.render(<ErrorBoundary />, container);
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <BrokenRender />
        <Normal />
      </ErrorBoundary>,
      container,
    );
    expect(container.textContent).toBe('Caught an error: Hello.');

    Scheduler.unstable_clearLog();
    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it("doesn't get into inconsistent state during reorders", () => {
    function getAMixOfNormalAndBrokenRenderElements() {
      const elements = [];
      for (let i = 0; i < 100; i++) {
        elements.push(<Normal key={i} />);
      }
      elements.push(<MaybeBrokenRender key={100} />);

      let currentIndex = elements.length;
      while (0 !== currentIndex) {
        const randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        const temporaryValue = elements[currentIndex];
        elements[currentIndex] = elements[randomIndex];
        elements[randomIndex] = temporaryValue;
      }
      return elements;
    }

    class MaybeBrokenRender extends React.Component {
      render() {
        if (fail) {
          throw new Error('Hello');
        }
        return <div>{this.props.children}</div>;
      }
    }

    let fail = false;
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>{getAMixOfNormalAndBrokenRenderElements()}</ErrorBoundary>,
      container,
    );
    expect(container.textContent).not.toContain('Caught an error');

    fail = true;
    ReactDOM.render(
      <ErrorBoundary>{getAMixOfNormalAndBrokenRenderElements()}</ErrorBoundary>,
      container,
    );
    expect(container.textContent).toBe('Caught an error: Hello.');

    Scheduler.unstable_clearLog();
    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it('catches errors originating downstream', () => {
    let fail = false;
    class Stateful extends React.Component {
      state = {shouldThrow: false};

      render() {
        if (fail) {
          Scheduler.log('Stateful render [!]');
          throw new Error('Hello');
        }
        return <div>{this.props.children}</div>;
      }
    }

    let statefulInst;
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <Stateful ref={inst => (statefulInst = inst)} />
      </ErrorBoundary>,
      container,
    );

    Scheduler.unstable_clearLog();
    expect(() => {
      fail = true;
      statefulInst.forceUpdate();
    }).not.toThrow();

    assertLog([
      'Stateful render [!]',
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render error',
      'ErrorBoundary componentDidUpdate',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it('catches errors in componentDidMount', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenComponentWillUnmount>
          <Normal />
        </BrokenComponentWillUnmount>
        <BrokenComponentDidMount />
        <Normal logName="LastChild" />
      </ErrorBoundary>,
      container,
    );
    assertLog([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenComponentWillUnmount constructor',
      'BrokenComponentWillUnmount componentWillMount',
      'BrokenComponentWillUnmount render',
      'Normal constructor',
      'Normal componentWillMount',
      'Normal render',
      'BrokenComponentDidMount constructor',
      'BrokenComponentDidMount componentWillMount',
      'BrokenComponentDidMount render',
      'LastChild constructor',
      'LastChild componentWillMount',
      'LastChild render',
      // Start flushing didMount queue
      'Normal componentDidMount',
      'BrokenComponentWillUnmount componentDidMount',
      'BrokenComponentDidMount componentDidMount [!]',
      // Continue despite the error
      'LastChild componentDidMount',
      // Now we are ready to handle the error
      'ErrorBoundary componentDidMount',
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render error',
      // Safely unmount every child
      'BrokenComponentWillUnmount componentWillUnmount [!]',
      // Continue unmounting safely despite any errors
      'Normal componentWillUnmount',
      'BrokenComponentDidMount componentWillUnmount',
      'LastChild componentWillUnmount',
      // The willUnmount error should be captured and logged, too.
      'ErrorBoundary componentDidUpdate',
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render error',
      // The update has finished
      'ErrorBoundary componentDidUpdate',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it('catches errors in componentDidUpdate', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenComponentDidUpdate />
      </ErrorBoundary>,
      container,
    );

    Scheduler.unstable_clearLog();
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenComponentDidUpdate />
      </ErrorBoundary>,
      container,
    );
    assertLog([
      'ErrorBoundary componentWillReceiveProps',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render success',
      'BrokenComponentDidUpdate componentWillReceiveProps',
      'BrokenComponentDidUpdate componentWillUpdate',
      'BrokenComponentDidUpdate render',
      // All lifecycles run
      'BrokenComponentDidUpdate componentDidUpdate [!]',
      'ErrorBoundary componentDidUpdate',
      // Then, error is handled
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render error',
      'BrokenComponentDidUpdate componentWillUnmount',
      'ErrorBoundary componentDidUpdate',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it('catches errors in useEffect', async () => {
    const container = document.createElement('div');
    await act(() => {
      ReactDOM.render(
        <ErrorBoundary>
          <BrokenUseEffect>Initial value</BrokenUseEffect>
        </ErrorBoundary>,
        container,
      );
      assertLog([
        'ErrorBoundary constructor',
        'ErrorBoundary componentWillMount',
        'ErrorBoundary render success',
        'BrokenUseEffect render',
        'ErrorBoundary componentDidMount',
      ]);

      expect(container.firstChild.textContent).toBe('Initial value');
      Scheduler.unstable_clearLog();
    });

    // verify flushed passive effects and handle the error
    assertLog([
      'BrokenUseEffect useEffect [!]',
      // Handle the error
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render error',
      'ErrorBoundary componentDidUpdate',
    ]);

    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
  });

  it('catches errors in useLayoutEffect', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenUseLayoutEffect>Initial value</BrokenUseLayoutEffect>
      </ErrorBoundary>,
      container,
    );
    assertLog([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenUseLayoutEffect render',
      'BrokenUseLayoutEffect useLayoutEffect [!]',
      // Fiber proceeds with the hooks
      'ErrorBoundary componentDidMount',
      // The error propagates to the higher boundary
      'ErrorBoundary static getDerivedStateFromError',
      // Fiber retries from the root
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render error',
      'ErrorBoundary componentDidUpdate',
    ]);

    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
  });

  it('propagates errors inside boundary during componentDidMount', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenComponentDidMountErrorBoundary
          renderError={error => (
            <div>We should never catch our own error: {error.message}.</div>
          )}
        />
      </ErrorBoundary>,
      container,
    );
    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
    assertLog([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenComponentDidMountErrorBoundary constructor',
      'BrokenComponentDidMountErrorBoundary componentWillMount',
      'BrokenComponentDidMountErrorBoundary render success',
      'BrokenComponentDidMountErrorBoundary componentDidMount [!]',
      // Fiber proceeds with the hooks
      'ErrorBoundary componentDidMount',
      // The error propagates to the higher boundary
      'ErrorBoundary static getDerivedStateFromError',
      // Fiber retries from the root
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render error',
      'BrokenComponentDidMountErrorBoundary componentWillUnmount',
      'ErrorBoundary componentDidUpdate',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog(['ErrorBoundary componentWillUnmount']);
  });

  it('calls static getDerivedStateFromError for each error that is captured', () => {
    function renderUnmountError(error) {
      return <div>Caught an unmounting error: {error.message}.</div>;
    }
    function renderUpdateError(error) {
      return <div>Caught an updating error: {error.message}.</div>;
    }

    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary logName="OuterErrorBoundary">
        <ErrorBoundary
          logName="InnerUnmountBoundary"
          renderError={renderUnmountError}>
          <BrokenComponentWillUnmount errorText="E1" />
          <BrokenComponentWillUnmount errorText="E2" />
        </ErrorBoundary>
        <ErrorBoundary
          logName="InnerUpdateBoundary"
          renderError={renderUpdateError}>
          <BrokenComponentDidUpdate errorText="E3" />
          <BrokenComponentDidUpdate errorText="E4" />
        </ErrorBoundary>
      </ErrorBoundary>,
      container,
    );

    Scheduler.unstable_clearLog();
    ReactDOM.render(
      <ErrorBoundary logName="OuterErrorBoundary">
        <ErrorBoundary
          logName="InnerUnmountBoundary"
          renderError={renderUnmountError}
        />
        <ErrorBoundary
          logName="InnerUpdateBoundary"
          renderError={renderUpdateError}>
          <BrokenComponentDidUpdate errorText="E3" />
          <BrokenComponentDidUpdate errorText="E4" />
        </ErrorBoundary>
      </ErrorBoundary>,
      container,
    );

    expect(container.firstChild.textContent).toBe(
      'Caught an unmounting error: E2.' + 'Caught an updating error: E4.',
    );
    assertLog([
      // Begin update phase
      'OuterErrorBoundary componentWillReceiveProps',
      'OuterErrorBoundary componentWillUpdate',
      'OuterErrorBoundary render success',
      'InnerUnmountBoundary componentWillReceiveProps',
      'InnerUnmountBoundary componentWillUpdate',
      'InnerUnmountBoundary render success',
      'InnerUpdateBoundary componentWillReceiveProps',
      'InnerUpdateBoundary componentWillUpdate',
      'InnerUpdateBoundary render success',
      // First come the updates
      'BrokenComponentDidUpdate componentWillReceiveProps',
      'BrokenComponentDidUpdate componentWillUpdate',
      'BrokenComponentDidUpdate render',
      'BrokenComponentDidUpdate componentWillReceiveProps',
      'BrokenComponentDidUpdate componentWillUpdate',
      'BrokenComponentDidUpdate render',
      // We're in commit phase now, deleting
      'BrokenComponentWillUnmount componentWillUnmount [!]',
      'BrokenComponentWillUnmount componentWillUnmount [!]',
      // Continue despite errors, handle them after commit is done
      'InnerUnmountBoundary componentDidUpdate',
      // We're still in commit phase, now calling update lifecycles
      'BrokenComponentDidUpdate componentDidUpdate [!]',
      // Again, continue despite errors, we'll handle them later
      'BrokenComponentDidUpdate componentDidUpdate [!]',
      'InnerUpdateBoundary componentDidUpdate',
      'OuterErrorBoundary componentDidUpdate',
      // After the commit phase, attempt to recover from any errors that
      // were captured
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary static getDerivedStateFromError',
      'InnerUnmountBoundary componentWillUpdate',
      'InnerUnmountBoundary render error',
      'ErrorBoundary static getDerivedStateFromError',
      'ErrorBoundary static getDerivedStateFromError',
      'InnerUpdateBoundary componentWillUpdate',
      'InnerUpdateBoundary render error',
      'BrokenComponentDidUpdate componentWillUnmount',
      'BrokenComponentDidUpdate componentWillUnmount',
      'InnerUnmountBoundary componentDidUpdate',
      'InnerUpdateBoundary componentDidUpdate',
    ]);

    ReactDOM.unmountComponentAtNode(container);
    assertLog([
      'OuterErrorBoundary componentWillUnmount',
      'InnerUnmountBoundary componentWillUnmount',
      'InnerUpdateBoundary componentWillUnmount',
    ]);
  });

  it('discards a bad root if the root component fails', () => {
    const X = null;
    const Y = undefined;
    let err1;
    let err2;

    try {
      const container = document.createElement('div');
      expect(() => ReactDOM.render(<X />, container)).toErrorDev(
        'React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function ' +
          '(for composite components) but got: null.',
      );
    } catch (err) {
      err1 = err;
    }
    try {
      const container = document.createElement('div');
      expect(() => ReactDOM.render(<Y />, container)).toErrorDev(
        'React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function ' +
          '(for composite components) but got: undefined.',
      );
    } catch (err) {
      err2 = err;
    }

    expect(err1.message).toMatch(/got: null/);
    expect(err2.message).toMatch(/got: undefined/);
  });

  it('renders empty output if error boundary does not handle the error', () => {
    const container = document.createElement('div');
    expect(() =>
      ReactDOM.render(
        <div>
          Sibling
          <NoopErrorBoundary>
            <BrokenRender />
          </NoopErrorBoundary>
        </div>,
        container,
      ),
    ).toThrow('Hello');
    expect(container.innerHTML).toBe('');
    assertLog([
      'NoopErrorBoundary constructor',
      'NoopErrorBoundary componentWillMount',
      'NoopErrorBoundary render',
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      // Noop error boundaries retry render (and fail again)
      'NoopErrorBoundary static getDerivedStateFromError',
      'NoopErrorBoundary render',
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
    ]);
  });

  it('passes first error when two errors happen in commit', () => {
    const errors = [];
    let caughtError;
    class Parent extends React.Component {
      render() {
        return <Child />;
      }
      componentDidMount() {
        errors.push('parent sad');
        throw new Error('parent sad');
      }
    }
    class Child extends React.Component {
      render() {
        return <div />;
      }
      componentDidMount() {
        errors.push('child sad');
        throw new Error('child sad');
      }
    }

    const container = document.createElement('div');
    try {
      // Here, we test the behavior where there is no error boundary and we
      // delegate to the host root.
      ReactDOM.render(<Parent />, container);
    } catch (e) {
      if (e.message !== 'parent sad' && e.message !== 'child sad') {
        throw e;
      }
      caughtError = e;
    }

    expect(errors).toEqual(['child sad', 'parent sad']);
    // Error should be the first thrown
    expect(caughtError.message).toBe('child sad');
  });

  it('propagates uncaught error inside unbatched initial mount', () => {
    function Foo() {
      throw new Error('foo error');
    }
    const container = document.createElement('div');
    expect(() => {
      ReactDOM.unstable_batchedUpdates(() => {
        ReactDOM.render(<Foo />, container);
      });
    }).toThrow('foo error');
  });

  it('handles errors that occur in before-mutation commit hook', () => {
    const errors = [];
    let caughtError;
    class Parent extends React.Component {
      getSnapshotBeforeUpdate() {
        errors.push('parent sad');
        throw new Error('parent sad');
      }
      componentDidUpdate() {}
      render() {
        return <Child {...this.props} />;
      }
    }
    class Child extends React.Component {
      getSnapshotBeforeUpdate() {
        errors.push('child sad');
        throw new Error('child sad');
      }
      componentDidUpdate() {}
      render() {
        return <div />;
      }
    }

    const container = document.createElement('div');
    ReactDOM.render(<Parent value={1} />, container);
    try {
      ReactDOM.render(<Parent value={2} />, container);
    } catch (e) {
      if (e.message !== 'parent sad' && e.message !== 'child sad') {
        throw e;
      }
      caughtError = e;
    }

    expect(errors).toEqual(['child sad', 'parent sad']);
    // Error should be the first thrown
    expect(caughtError.message).toBe('child sad');
  });

  it('should warn if an error boundary with only componentDidCatch does not update state', () => {
    class InvalidErrorBoundary extends React.Component {
      componentDidCatch(error, info) {
        // This component does not define getDerivedStateFromError().
        // It also doesn't call setState().
        // So it would swallow errors (which is probably unintentional).
      }
      render() {
        return this.props.children;
      }
    }

    const Throws = () => {
      throw new Error('expected');
    };

    const container = document.createElement('div');
    expect(() => {
      ReactDOM.render(
        <InvalidErrorBoundary>
          <Throws />
        </InvalidErrorBoundary>,
        container,
      );
    }).toErrorDev(
      'InvalidErrorBoundary: Error boundaries should implement getDerivedStateFromError(). ' +
        'In that method, return a state update to display an error message or fallback UI.',
    );
    expect(container.textContent).toBe('');
  });

  it('should call both componentDidCatch and getDerivedStateFromError if both exist on a component', () => {
    let componentDidCatchError, getDerivedStateFromErrorError;
    class ErrorBoundaryWithBothMethods extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        getDerivedStateFromErrorError = error;
        return {error};
      }
      componentDidCatch(error, info) {
        componentDidCatchError = error;
      }
      render() {
        return this.state.error ? 'ErrorBoundary' : this.props.children;
      }
    }

    const thrownError = new Error('expected');
    const Throws = () => {
      throw thrownError;
    };

    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundaryWithBothMethods>
        <Throws />
      </ErrorBoundaryWithBothMethods>,
      container,
    );
    expect(container.textContent).toBe('ErrorBoundary');
    expect(componentDidCatchError).toBe(thrownError);
    expect(getDerivedStateFromErrorError).toBe(thrownError);
  });

  it('should catch errors from invariants in completion phase', () => {
    const container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <input>
          <div />
        </input>
      </ErrorBoundary>,
      container,
    );
    expect(container.textContent).toContain(
      'Caught an error: input is a void element tag',
    );
  });

  it('should catch errors from errors in the throw phase from boundaries', () => {
    const container = document.createElement('div');

    const thrownError = new Error('original error');
    const Throws = () => {
      throw thrownError;
    };

    class EvilErrorBoundary extends React.Component {
      get componentDidCatch() {
        throw new Error('gotta catch em all');
      }
      render() {
        return this.props.children;
      }
    }

    ReactDOM.render(
      <ErrorBoundary>
        <EvilErrorBoundary>
          <Throws />
        </EvilErrorBoundary>
      </ErrorBoundary>,
      container,
    );

    expect(container.textContent).toContain(
      'Caught an error: gotta catch em all',
    );
  });

  it('should protect errors from errors in the stack generation', () => {
    const container = document.createElement('div');

    const evilError = {
      message: 'gotta catch em all',
      get stack() {
        throw new Error('gotta catch em all');
      },
    };
    const Throws = () => {
      throw evilError;
    };
    Object.defineProperty(Throws, 'displayName', {
      get: function () {
        throw new Error('gotta catch em all');
      },
    });

    function Wrapper() {
      return <Throws />;
    }

    ReactDOM.render(
      <ErrorBoundary>
        <Wrapper />
      </ErrorBoundary>,
      container,
    );

    expect(container.textContent).toContain(
      'Caught an error: gotta catch em all.',
    );
  });

  it('catches errors thrown in componentWillUnmount', () => {
    class LocalErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        Scheduler.log(`ErrorBoundary static getDerivedStateFromError`);
        return {error};
      }
      render() {
        const {children, id, fallbackID} = this.props;
        const {error} = this.state;
        if (error) {
          Scheduler.log(`${id} render error`);
          return <Component id={fallbackID} />;
        }
        Scheduler.log(`${id} render success`);
        return children || null;
      }
    }

    class Component extends React.Component {
      render() {
        const {id} = this.props;
        Scheduler.log('Component render ' + id);
        return id;
      }
    }

    class LocalBrokenComponentWillUnmount extends React.Component {
      componentWillUnmount() {
        Scheduler.log('BrokenComponentWillUnmount componentWillUnmount');
        throw Error('Expected');
      }

      render() {
        Scheduler.log('BrokenComponentWillUnmount render');
        return 'broken';
      }
    }

    const container = document.createElement('div');

    ReactDOM.render(
      <LocalErrorBoundary id="OuterBoundary" fallbackID="OuterFallback">
        <Component id="sibling" />
        <LocalErrorBoundary id="InnerBoundary" fallbackID="InnerFallback">
          <LocalBrokenComponentWillUnmount />
        </LocalErrorBoundary>
      </LocalErrorBoundary>,
      container,
    );

    expect(container.firstChild.textContent).toBe('sibling');
    expect(container.lastChild.textContent).toBe('broken');
    assertLog([
      'OuterBoundary render success',
      'Component render sibling',
      'InnerBoundary render success',
      'BrokenComponentWillUnmount render',
    ]);

    ReactDOM.render(
      <LocalErrorBoundary id="OuterBoundary" fallbackID="OuterFallback">
        <Component id="sibling" />
      </LocalErrorBoundary>,
      container,
    );

    // React should skip over the unmounting boundary and find the nearest still-mounted boundary.
    expect(container.firstChild.textContent).toBe('OuterFallback');
    expect(container.lastChild.textContent).toBe('OuterFallback');
    assertLog([
      'OuterBoundary render success',
      'Component render sibling',
      'BrokenComponentWillUnmount componentWillUnmount',
      'ErrorBoundary static getDerivedStateFromError',
      'OuterBoundary render error',
      'Component render OuterFallback',
    ]);
  });

  it('catches errors thrown while detaching refs', () => {
    class LocalErrorBoundary extends React.Component {
      state = {error: null};
      static getDerivedStateFromError(error) {
        Scheduler.log(`ErrorBoundary static getDerivedStateFromError`);
        return {error};
      }
      render() {
        const {children, id, fallbackID} = this.props;
        const {error} = this.state;
        if (error) {
          Scheduler.log(`${id} render error`);
          return <Component id={fallbackID} />;
        }
        Scheduler.log(`${id} render success`);
        return children || null;
      }
    }

    class Component extends React.Component {
      render() {
        const {id} = this.props;
        Scheduler.log('Component render ' + id);
        return id;
      }
    }

    class LocalBrokenCallbackRef extends React.Component {
      _ref = ref => {
        Scheduler.log('LocalBrokenCallbackRef ref ' + !!ref);
        if (ref === null) {
          throw Error('Expected');
        }
      };

      render() {
        Scheduler.log('LocalBrokenCallbackRef render');
        return <div ref={this._ref}>ref</div>;
      }
    }

    const container = document.createElement('div');

    ReactDOM.render(
      <LocalErrorBoundary id="OuterBoundary" fallbackID="OuterFallback">
        <Component id="sibling" />
        <LocalErrorBoundary id="InnerBoundary" fallbackID="InnerFallback">
          <LocalBrokenCallbackRef />
        </LocalErrorBoundary>
      </LocalErrorBoundary>,
      container,
    );

    expect(container.firstChild.textContent).toBe('sibling');
    expect(container.lastChild.textContent).toBe('ref');
    assertLog([
      'OuterBoundary render success',
      'Component render sibling',
      'InnerBoundary render success',
      'LocalBrokenCallbackRef render',
      'LocalBrokenCallbackRef ref true',
    ]);

    ReactDOM.render(
      <LocalErrorBoundary id="OuterBoundary" fallbackID="OuterFallback">
        <Component id="sibling" />
      </LocalErrorBoundary>,
      container,
    );

    // React should skip over the unmounting boundary and find the nearest still-mounted boundary.
    expect(container.firstChild.textContent).toBe('OuterFallback');
    expect(container.lastChild.textContent).toBe('OuterFallback');
    assertLog([
      'OuterBoundary render success',
      'Component render sibling',
      'LocalBrokenCallbackRef ref false',
      'ErrorBoundary static getDerivedStateFromError',
      'OuterBoundary render error',
      'Component render OuterFallback',
    ]);
  });
});
