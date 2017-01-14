/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');

var React;
var ReactDOM;

describe('ReactErrorBoundaries', () => {
  var log;

  var BrokenConstructor;
  var BrokenComponentWillMount;
  var BrokenComponentDidMount;
  var BrokenComponentWillReceiveProps;
  var BrokenComponentWillUpdate;
  var BrokenComponentDidUpdate;
  var BrokenComponentWillUnmount;
  var BrokenRenderErrorBoundary;
  var BrokenComponentWillMountErrorBoundary;
  var BrokenComponentDidMountErrorBoundary;
  var BrokenRender;
  var ErrorBoundary;
  var ErrorMessage;
  var NoopErrorBoundary;
  var RetryErrorBoundary;
  var Normal;

  beforeEach(() => {
    ReactDOM = require('ReactDOM');
    React = require('React');

    log = [];

    BrokenConstructor = class extends React.Component {
      constructor(props) {
        super(props);
        log.push('BrokenConstructor constructor [!]');
        throw new Error('Hello');
      }
      render() {
        log.push('BrokenConstructor render');
        return <div>{this.props.children}</div>;
      }
      componentWillMount() {
        log.push('BrokenConstructor componentWillMount');
      }
      componentDidMount() {
        log.push('BrokenConstructor componentDidMount');
      }
      componentWillReceiveProps() {
        log.push('BrokenConstructor componentWillReceiveProps');
      }
      componentWillUpdate() {
        log.push('BrokenConstructor componentWillUpdate');
      }
      componentDidUpdate() {
        log.push('BrokenConstructor componentDidUpdate');
      }
      componentWillUnmount() {
        log.push('BrokenConstructor componentWillUnmount');
      }
    };

    BrokenComponentWillMount = class extends React.Component {
      constructor(props) {
        super(props);
        log.push('BrokenComponentWillMount constructor');
      }
      render() {
        log.push('BrokenComponentWillMount render');
        return <div>{this.props.children}</div>;
      }
      componentWillMount() {
        log.push('BrokenComponentWillMount componentWillMount [!]');
        throw new Error('Hello');
      }
      componentDidMount() {
        log.push('BrokenComponentWillMount componentDidMount');
      }
      componentWillReceiveProps() {
        log.push('BrokenComponentWillMount componentWillReceiveProps');
      }
      componentWillUpdate() {
        log.push('BrokenComponentWillMount componentWillUpdate');
      }
      componentDidUpdate() {
        log.push('BrokenComponentWillMount componentDidUpdate');
      }
      componentWillUnmount() {
        log.push('BrokenComponentWillMount componentWillUnmount');
      }
    };

    BrokenComponentDidMount = class extends React.Component {
      constructor(props) {
        super(props);
        log.push('BrokenComponentDidMount constructor');
      }
      render() {
        log.push('BrokenComponentDidMount render');
        return <div>{this.props.children}</div>;
      }
      componentWillMount() {
        log.push('BrokenComponentDidMount componentWillMount');
      }
      componentDidMount() {
        log.push('BrokenComponentDidMount componentDidMount [!]');
        throw new Error('Hello');
      }
      componentWillReceiveProps() {
        log.push('BrokenComponentDidMount componentWillReceiveProps');
      }
      componentWillUpdate() {
        log.push('BrokenComponentDidMount componentWillUpdate');
      }
      componentDidUpdate() {
        log.push('BrokenComponentDidMount componentDidUpdate');
      }
      componentWillUnmount() {
        log.push('BrokenComponentDidMount componentWillUnmount');
      }
    };

    BrokenComponentWillReceiveProps = class extends React.Component {
      constructor(props) {
        super(props);
        log.push('BrokenComponentWillReceiveProps constructor');
      }
      render() {
        log.push('BrokenComponentWillReceiveProps render');
        return <div>{this.props.children}</div>;
      }
      componentWillMount() {
        log.push('BrokenComponentWillReceiveProps componentWillMount');
      }
      componentDidMount() {
        log.push('BrokenComponentWillReceiveProps componentDidMount');
      }
      componentWillReceiveProps() {
        log.push('BrokenComponentWillReceiveProps componentWillReceiveProps [!]');
        throw new Error('Hello');
      }
      componentWillUpdate() {
        log.push('BrokenComponentWillReceiveProps componentWillUpdate');
      }
      componentDidUpdate() {
        log.push('BrokenComponentWillReceiveProps componentDidUpdate');
      }
      componentWillUnmount() {
        log.push('BrokenComponentWillReceiveProps componentWillUnmount');
      }
    };

    BrokenComponentWillUpdate = class extends React.Component {
      constructor(props) {
        super(props);
        log.push('BrokenComponentWillUpdate constructor');
      }
      render() {
        log.push('BrokenComponentWillUpdate render');
        return <div>{this.props.children}</div>;
      }
      componentWillMount() {
        log.push('BrokenComponentWillUpdate componentWillMount');
      }
      componentDidMount() {
        log.push('BrokenComponentWillUpdate componentDidMount');
      }
      componentWillReceiveProps() {
        log.push('BrokenComponentWillUpdate componentWillReceiveProps');
      }
      componentWillUpdate() {
        log.push('BrokenComponentWillUpdate componentWillUpdate [!]');
        throw new Error('Hello');
      }
      componentDidUpdate() {
        log.push('BrokenComponentWillUpdate componentDidUpdate');
      }
      componentWillUnmount() {
        log.push('BrokenComponentWillUpdate componentWillUnmount');
      }
    };

    BrokenComponentDidUpdate = class extends React.Component {
      static defaultProps = {
        errorText: 'Hello',
      };
      constructor(props) {
        super(props);
        log.push('BrokenComponentDidUpdate constructor');
      }
      render() {
        log.push('BrokenComponentDidUpdate render');
        return <div>{this.props.children}</div>;
      }
      componentWillMount() {
        log.push('BrokenComponentDidUpdate componentWillMount');
      }
      componentDidMount() {
        log.push('BrokenComponentDidUpdate componentDidMount');
      }
      componentWillReceiveProps() {
        log.push('BrokenComponentDidUpdate componentWillReceiveProps');
      }
      componentWillUpdate() {
        log.push('BrokenComponentDidUpdate componentWillUpdate');
      }
      componentDidUpdate() {
        log.push('BrokenComponentDidUpdate componentDidUpdate [!]');
        throw new Error(this.props.errorText);
      }
      componentWillUnmount() {
        log.push('BrokenComponentDidUpdate componentWillUnmount');
      }
    };

    BrokenComponentWillUnmount = class extends React.Component {
      static defaultProps = {
        errorText: 'Hello',
      };
      constructor(props) {
        super(props);
        log.push('BrokenComponentWillUnmount constructor');
      }
      render() {
        log.push('BrokenComponentWillUnmount render');
        return <div>{this.props.children}</div>;
      }
      componentWillMount() {
        log.push('BrokenComponentWillUnmount componentWillMount');
      }
      componentDidMount() {
        log.push('BrokenComponentWillUnmount componentDidMount');
      }
      componentWillReceiveProps() {
        log.push('BrokenComponentWillUnmount componentWillReceiveProps');
      }
      componentWillUpdate() {
        log.push('BrokenComponentWillUnmount componentWillUpdate');
      }
      componentDidUpdate() {
        log.push('BrokenComponentWillUnmount componentDidUpdate');
      }
      componentWillUnmount() {
        log.push('BrokenComponentWillUnmount componentWillUnmount [!]');
        throw new Error(this.props.errorText);
      }
    };

    BrokenComponentWillMountErrorBoundary = class extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: null};
        log.push('BrokenComponentWillMountErrorBoundary constructor');
      }
      render() {
        if (this.state.error) {
          log.push('BrokenComponentWillMountErrorBoundary render error');
          return <div>Caught an error: {this.state.error.message}.</div>;
        }
        log.push('BrokenComponentWillMountErrorBoundary render success');
        return <div>{this.props.children}</div>;
      }
      componentWillMount() {
        log.push('BrokenComponentWillMountErrorBoundary componentWillMount [!]');
        throw new Error('Hello');
      }
      componentDidMount() {
        log.push('BrokenComponentWillMountErrorBoundary componentDidMount');
      }
      componentWillUnmount() {
        log.push('BrokenComponentWillMountErrorBoundary componentWillUnmount');
      }
      unstable_handleError(error) {
        log.push('BrokenComponentWillMountErrorBoundary unstable_handleError');
        this.setState({error});
      }
    };

    BrokenComponentDidMountErrorBoundary = class extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: null};
        log.push('BrokenComponentDidMountErrorBoundary constructor');
      }
      render() {
        if (this.state.error) {
          log.push('BrokenComponentDidMountErrorBoundary render error');
          return <div>Caught an error: {this.state.error.message}.</div>;
        }
        log.push('BrokenComponentDidMountErrorBoundary render success');
        return <div>{this.props.children}</div>;
      }
      componentWillMount() {
        log.push('BrokenComponentDidMountErrorBoundary componentWillMount');
      }
      componentDidMount() {
        log.push('BrokenComponentDidMountErrorBoundary componentDidMount [!]');
        throw new Error('Hello');
      }
      componentWillUnmount() {
        log.push('BrokenComponentDidMountErrorBoundary componentWillUnmount');
      }
      unstable_handleError(error) {
        log.push('BrokenComponentDidMountErrorBoundary unstable_handleError');
        this.setState({error});
      }
    };

    BrokenRenderErrorBoundary = class extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: null};
        log.push('BrokenRenderErrorBoundary constructor');
      }
      render() {
        if (this.state.error) {
          log.push('BrokenRenderErrorBoundary render error [!]');
          throw new Error('Hello');
        }
        log.push('BrokenRenderErrorBoundary render success');
        return <div>{this.props.children}</div>;
      }
      componentWillMount() {
        log.push('BrokenRenderErrorBoundary componentWillMount');
      }
      componentDidMount() {
        log.push('BrokenRenderErrorBoundary componentDidMount');
      }
      componentWillUnmount() {
        log.push('BrokenRenderErrorBoundary componentWillUnmount');
      }
      unstable_handleError(error) {
        log.push('BrokenRenderErrorBoundary unstable_handleError');
        this.setState({error});
      }
    };

    BrokenRender = class extends React.Component {
      constructor(props) {
        super(props);
        log.push('BrokenRender constructor');
      }
      render() {
        log.push('BrokenRender render [!]');
        throw new Error('Hello');
      }
      componentWillMount() {
        log.push('BrokenRender componentWillMount');
      }
      componentDidMount() {
        log.push('BrokenRender componentDidMount');
      }
      componentWillReceiveProps() {
        log.push('BrokenRender componentWillReceiveProps');
      }
      componentWillUpdate() {
        log.push('BrokenRender componentWillUpdate');
      }
      componentDidUpdate() {
        log.push('BrokenRender componentDidUpdate');
      }
      componentWillUnmount() {
        log.push('BrokenRender componentWillUnmount');
      }
    };

    NoopErrorBoundary = class extends React.Component {
      constructor(props) {
        super(props);
        log.push('NoopErrorBoundary constructor');
      }
      render() {
        log.push('NoopErrorBoundary render');
        return <BrokenRender />;
      }
      componentWillMount() {
        log.push('NoopErrorBoundary componentWillMount');
      }
      componentDidMount() {
        log.push('NoopErrorBoundary componentDidMount');
      }
      componentWillUnmount() {
        log.push('NoopErrorBoundary componentWillUnmount');
      }
      unstable_handleError() {
        if (ReactDOMFeatureFlags.useFiber) {
          log.push('NoopErrorBoundary unstable_handleError');
        } else {
          // In Stack, not calling setState() is treated as a rethrow.
          log.push('NoopErrorBoundary unstable_handleError [*]');
        }
      }
    };

    Normal = class extends React.Component {
      static defaultProps = {
        logName: 'Normal',
      };
      constructor(props) {
        super(props);
        log.push(`${this.props.logName} constructor`);
      }
      render() {
        log.push(`${this.props.logName} render`);
        return <div>{this.props.children}</div>;
      }
      componentWillMount() {
        log.push(`${this.props.logName} componentWillMount`);
      }
      componentDidMount() {
        log.push(`${this.props.logName} componentDidMount`);
      }
      componentWillReceiveProps() {
        log.push(`${this.props.logName} componentWillReceiveProps`);
      }
      componentWillUpdate() {
        log.push(`${this.props.logName} componentWillUpdate`);
      }
      componentDidUpdate() {
        log.push(`${this.props.logName} componentDidUpdate`);
      }
      componentWillUnmount() {
        log.push(`${this.props.logName} componentWillUnmount`);
      }
    };

    ErrorBoundary = class extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: null};
        log.push(`${this.props.logName} constructor`);
      }
      render() {
        if (this.state.error && !this.props.forceRetry) {
          log.push(`${this.props.logName} render error`);
          return this.props.renderError(this.state.error, this.props);
        }
        log.push(`${this.props.logName} render success`);
        return <div>{this.props.children}</div>;
      }
      unstable_handleError(error) {
        log.push(`${this.props.logName} unstable_handleError`);
        this.setState({error});
      }
      componentWillMount() {
        log.push(`${this.props.logName} componentWillMount`);
      }
      componentDidMount() {
        log.push(`${this.props.logName} componentDidMount`);
      }
      componentWillReceiveProps() {
        log.push(`${this.props.logName} componentWillReceiveProps`);
      }
      componentWillUpdate() {
        log.push(`${this.props.logName} componentWillUpdate`);
      }
      componentDidUpdate() {
        log.push(`${this.props.logName} componentDidUpdate`);
      }
      componentWillUnmount() {
        log.push(`${this.props.logName} componentWillUnmount`);
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
        log.push('RetryErrorBoundary constructor');
      }
      render() {
        log.push('RetryErrorBoundary render');
        return <BrokenRender />;
      }
      componentWillMount() {
        log.push('RetryErrorBoundary componentWillMount');
      }
      componentDidMount() {
        log.push('RetryErrorBoundary componentDidMount');
      }
      componentWillUnmount() {
        log.push('RetryErrorBoundary componentWillUnmount');
      }
      unstable_handleError(error) {
        if (ReactDOMFeatureFlags.useFiber) {
          log.push('RetryErrorBoundary unstable_handleError [!]');
          // In Fiber, calling setState() (and failing) is treated as a rethrow.
          this.setState({});
        } else {
          log.push('RetryErrorBoundary unstable_handleError [*]');
          // In Stack, not calling setState() is treated as a rethrow.
        }
      }
    };

    ErrorMessage = class extends React.Component {
      constructor(props) {
        super(props);
        log.push('ErrorMessage constructor');
      }
      componentWillMount() {
        log.push('ErrorMessage componentWillMount');
      }
      componentDidMount() {
        log.push('ErrorMessage componentDidMount');
      }
      componentWillUnmount() {
        log.push('ErrorMessage componentWillUnmount');
      }
      render() {
        log.push('ErrorMessage render');
        return <div>Caught an error: {this.props.message}.</div>;
      }
    };
  });

  it('does not swallow exceptions on mounting without boundaries', () => {
    var container = document.createElement('div');
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
    var container = document.createElement('div');
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
    var container = document.createElement('div');
    ReactDOM.render(<BrokenComponentWillUnmount />, container);
    expect(() => {
      ReactDOM.unmountComponentAtNode(container);
    }).toThrow('Hello');
  });

  it('prevents errors from leaking into other roots', () => {
    var container1 = document.createElement('div');
    var container2 = document.createElement('div');
    var container3 = document.createElement('div');

    ReactDOM.render(<span>Before 1</span>, container1);
    expect(() => {
      ReactDOM.render(<BrokenRender />, container2);
    }).toThrow('Hello');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenRender />
      </ErrorBoundary>,
      container3
    );
    expect(container1.firstChild.textContent).toBe('Before 1');
    expect(container2.firstChild).toBe(null);
    expect(container3.firstChild.textContent).toBe('Caught an error: Hello.');

    ReactDOM.render(<span>After 1</span>, container1);
    ReactDOM.render(<span>After 2</span>, container2);
    ReactDOM.render(
      <ErrorBoundary forceRetry={true}>
        After 3
      </ErrorBoundary>,
      container3
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

  it('renders an error state if child throws in render', () => {
    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenRender />
      </ErrorBoundary>,
      container
    );
    expect(container.firstChild.textContent).toBe(
      'Caught an error: Hello.'
    );
    expect(log).toEqual([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      ...(ReactDOMFeatureFlags.useFiber ? [
        // Fiber mounts with null children before capturing error
        'ErrorBoundary componentDidMount',
        // Catch and render an error message
        'ErrorBoundary unstable_handleError',
        'ErrorBoundary componentWillUpdate',
        'ErrorBoundary render error',
        'ErrorBoundary componentDidUpdate',
      ] : [
        // Catch and render an error message
        'ErrorBoundary unstable_handleError',
        'ErrorBoundary render error',
        'ErrorBoundary componentDidMount',
      ]),
    ]);

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
    ]);
  });

  it('renders an error state if child throws in constructor', () => {
    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenConstructor />
      </ErrorBoundary>,
      container
    );
    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
    expect(log).toEqual([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenConstructor constructor [!]',
      ...(ReactDOMFeatureFlags.useFiber ? [
        // Fiber mounts with null children before capturing error
        'ErrorBoundary componentDidMount',
        // Catch and render an error message
        'ErrorBoundary unstable_handleError',
        'ErrorBoundary componentWillUpdate',
        'ErrorBoundary render error',
        'ErrorBoundary componentDidUpdate',
      ] : [
        // Catch and render an error message
        'ErrorBoundary unstable_handleError',
        'ErrorBoundary render error',
        'ErrorBoundary componentDidMount',
      ]),
    ]);

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
    ]);
  });

  it('renders an error state if child throws in componentWillMount', () => {
    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenComponentWillMount />
      </ErrorBoundary>,
      container
    );
    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
    expect(log).toEqual([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenComponentWillMount constructor',
      'BrokenComponentWillMount componentWillMount [!]',
      ...(ReactDOMFeatureFlags.useFiber ? [
        'ErrorBoundary componentDidMount',
        'ErrorBoundary unstable_handleError',
        'ErrorBoundary componentWillUpdate',
        'ErrorBoundary render error',
        'ErrorBoundary componentDidUpdate',
      ] : [
        // Catch and render an error message
        'ErrorBoundary unstable_handleError',
        'ErrorBoundary render error',
        'ErrorBoundary componentDidMount',
      ]),
    ]);

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
    ]);
  });

  it('renders an error state if context provider throws in componentWillMount', () => {
    class BrokenComponentWillMountWithContext extends React.Component {
      static childContextTypes = {foo: React.PropTypes.number};
      getChildContext() {
        return {foo: 42};
      }
      render() {
        return <div>{this.props.children}</div>;
      }
      componentWillMount() {
        throw new Error('Hello');
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenComponentWillMountWithContext />
      </ErrorBoundary>,
      container
    );
    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
  });

  it('renders an error state if module-style context provider throws in componentWillMount', () => {
    function BrokenComponentWillMountWithContext() {
      return {
        getChildContext() {
          return {foo: 42};
        },
        render() {
          return <div>{this.props.children}</div>;
        },
        componentWillMount() {
          throw new Error('Hello');
        },
      };
    }
    BrokenComponentWillMountWithContext.childContextTypes = {
      foo: React.PropTypes.number,
    };

    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenComponentWillMountWithContext />
      </ErrorBoundary>,
      container
    );
    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
  });

  it('mounts the error message if mounting fails', () => {
    function renderError(error) {
      return (
        <ErrorMessage message={error.message} />
      );
    }

    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary renderError={renderError}>
        <BrokenRender />
      </ErrorBoundary>,
      container
    );
    expect(log).toEqual([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      ...(ReactDOMFeatureFlags.useFiber ? [
        'ErrorBoundary componentDidMount',
        'ErrorBoundary unstable_handleError',
        'ErrorBoundary componentWillUpdate',
        'ErrorBoundary render error',
        'ErrorMessage constructor',
        'ErrorMessage componentWillMount',
        'ErrorMessage render',
        'ErrorMessage componentDidMount',
        'ErrorBoundary componentDidUpdate',
      ] : [
        // Handle the error:
        'ErrorBoundary unstable_handleError',
        'ErrorBoundary render error',
        // Mount the error message:
        'ErrorMessage constructor',
        'ErrorMessage componentWillMount',
        'ErrorMessage render',
        'ErrorMessage componentDidMount',
        'ErrorBoundary componentDidMount',
      ]),
    ]);

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
      'ErrorMessage componentWillUnmount',
    ]);
  });

  it('propagates errors on retry on mounting', () => {
    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <RetryErrorBoundary>
          <BrokenRender />
        </RetryErrorBoundary>
      </ErrorBoundary>,
      container
    );
    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
    expect(log).toEqual([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'RetryErrorBoundary constructor',
      'RetryErrorBoundary componentWillMount',
      'RetryErrorBoundary render',
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      ...(ReactDOMFeatureFlags.useFiber ? [
        // In Fiber, failed error boundaries render null before attempting to recover
        'RetryErrorBoundary componentDidMount',
        'RetryErrorBoundary unstable_handleError [!]',
        'ErrorBoundary componentDidMount',
        // Retry
        'RetryErrorBoundary render',
        'BrokenRender constructor',
        'BrokenRender componentWillMount',
        'BrokenRender render [!]',
        // This time, the error propagates to the higher boundary
        'RetryErrorBoundary componentWillUnmount',
        'ErrorBoundary unstable_handleError',
        // Render the error
        'ErrorBoundary componentWillUpdate',
        'ErrorBoundary render error',
        'ErrorBoundary componentDidUpdate',
      ] : [
        // The first error boundary catches the error.
        // However, it doesn't adjust its state so next render will also fail.
        'RetryErrorBoundary unstable_handleError [*]',
        'RetryErrorBoundary render',
        'BrokenRender constructor',
        'BrokenRender componentWillMount',
        'BrokenRender render [!]',
        // This time, the error propagates to the higher boundary
        'ErrorBoundary unstable_handleError',
        // Render the error
        'ErrorBoundary render error',
        'ErrorBoundary componentDidMount',
      ]),
    ]);

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
    ]);
  });

  it('propagates errors inside boundary during componentWillMount', () => {
    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenComponentWillMountErrorBoundary />
      </ErrorBoundary>,
      container
    );
    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
    expect(log).toEqual([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenComponentWillMountErrorBoundary constructor',
      'BrokenComponentWillMountErrorBoundary componentWillMount [!]',
      // The error propagates to the higher boundary
      ...(ReactDOMFeatureFlags.useFiber ? [
        'ErrorBoundary componentDidMount',
        'ErrorBoundary unstable_handleError',
        'ErrorBoundary componentWillUpdate',
        'ErrorBoundary render error',
        'ErrorBoundary componentDidUpdate',
      ] : [
        'ErrorBoundary unstable_handleError',
        // Render the error
        'ErrorBoundary render error',
        'ErrorBoundary componentDidMount',
      ]),
    ]);

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
    ]);
  });

  it('propagates errors inside boundary while rendering error state', () => {
    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenRenderErrorBoundary>
          <BrokenRender />
        </BrokenRenderErrorBoundary>
      </ErrorBoundary>,
      container
    );
    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
    expect(log).toEqual([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenRenderErrorBoundary constructor',
      'BrokenRenderErrorBoundary componentWillMount',
      'BrokenRenderErrorBoundary render success',
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      // The first error boundary catches the error
      // It adjusts state but throws displaying the message
      ...(ReactDOMFeatureFlags.useFiber ? [
        // Finish mounting with null children
        'BrokenRenderErrorBoundary componentDidMount',
        // Attempt to handle the error
        'BrokenRenderErrorBoundary unstable_handleError',
        'ErrorBoundary componentDidMount',
        'BrokenRenderErrorBoundary render error [!]',
        // Boundary fails with new error, propagate to next boundary
        'BrokenRenderErrorBoundary componentWillUnmount',
        // Attempt to handle the error again
        'ErrorBoundary unstable_handleError',
        'ErrorBoundary componentWillUpdate',
        'ErrorBoundary render error',
        'ErrorBoundary componentDidUpdate',
      ] : [
        'BrokenRenderErrorBoundary unstable_handleError',
        'BrokenRenderErrorBoundary render error [!]',
        // The error propagates to the higher boundary
        'ErrorBoundary unstable_handleError',
        // Render the error
        'ErrorBoundary render error',
        'ErrorBoundary componentDidMount',
      ]),
    ]);

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
    ]);
  });

  it('does not call componentWillUnmount when aborting initial mount', () => {
    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <BrokenRender />
        <Normal />
      </ErrorBoundary>,
      container
    );
    expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
    expect(log).toEqual([
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
      ...(ReactDOMFeatureFlags.useFiber ? [
        // Finish mounting with null children
        'ErrorBoundary componentDidMount',
        // Handle the error
        'ErrorBoundary unstable_handleError',
        // Render the error message
        'ErrorBoundary componentWillUpdate',
        'ErrorBoundary render error',
        'ErrorBoundary componentDidUpdate',
      ] : [
        'ErrorBoundary unstable_handleError',
        // Render the error message
        'ErrorBoundary render error',
        'ErrorBoundary componentDidMount',
      ]),
    ]);

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
    ]);
  });

  it('resets refs if mounting aborts', () => {
    function childRef(x) {
      log.push('Child ref is set to ' + x);
    }
    function errorMessageRef(x) {
      log.push('Error message ref is set to ' + x);
    }

    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary errorMessageRef={errorMessageRef}>
        <div ref={childRef} />
        <BrokenRender />
      </ErrorBoundary>,
      container
    );
    expect(container.textContent).toBe('Caught an error: Hello.');
    expect(log).toEqual([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      // Handle error:
      ...(ReactDOMFeatureFlags.useFiber ? [
        // Finish mounting with null children
        'ErrorBoundary componentDidMount',
        // Handle the error
        'ErrorBoundary unstable_handleError',
        // Render the error message
        'ErrorBoundary componentWillUpdate',
        'ErrorBoundary render error',
        'Error message ref is set to [object HTMLDivElement]',
        'ErrorBoundary componentDidUpdate',
      ] : [
        'ErrorBoundary unstable_handleError',
        // Stack reconciler resets ref on update, as it doesn't know ref was never set.
        // This is unnecessary, and Fiber doesn't do it:
        'Child ref is set to null',
        'ErrorBoundary render error',
        // Ref to error message should get set:
        'Error message ref is set to [object HTMLDivElement]',
        'ErrorBoundary componentDidMount',
      ]),
    ]);

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
      'Error message ref is set to null',
    ]);
  });

  it('successfully mounts if no error occurs', () => {
    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <div>Mounted successfully.</div>
      </ErrorBoundary>,
      container
    );
    expect(container.firstChild.textContent).toBe('Mounted successfully.');
    expect(log).toEqual([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'ErrorBoundary componentDidMount',
    ]);

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
    ]);
  });

  it('catches if child throws in constructor during update', () => {
    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
      </ErrorBoundary>,
      container
    );

    log.length = 0;
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <Normal logName="Normal2" />
        <BrokenConstructor />
      </ErrorBoundary>,
      container
    );
    expect(container.textContent).toBe('Caught an error: Hello.');
    expect(log).toEqual([
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
      ...(ReactDOMFeatureFlags.useFiber ? [
        // Finish updating with null children
        'Normal componentWillUnmount',
        'ErrorBoundary componentDidUpdate',
        // Handle the error
        'ErrorBoundary unstable_handleError',
        // Render the error message
        'ErrorBoundary componentWillUpdate',
        'ErrorBoundary render error',
        'ErrorBoundary componentDidUpdate',
      ] : [
        'ErrorBoundary unstable_handleError',
        // Stack unmounts first, then renders:
        'Normal componentWillUnmount',
        'ErrorBoundary render error',
        // Normal2 does not get lifefycle because it was never mounted
        'ErrorBoundary componentDidUpdate',
      ]),
    ]);

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
    ]);
  });

  it('catches if child throws in componentWillMount during update', () => {
    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
      </ErrorBoundary>,
      container
    );

    log.length = 0;
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <Normal logName="Normal2" />
        <BrokenComponentWillMount />
      </ErrorBoundary>,
      container
    );
    expect(container.textContent).toBe('Caught an error: Hello.');
    expect(log).toEqual([
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
      ...(ReactDOMFeatureFlags.useFiber ? [
        // Finish updating with null children
        'Normal componentWillUnmount',
        'ErrorBoundary componentDidUpdate',
        // Handle the error
        'ErrorBoundary unstable_handleError',
        // Render the error message
        'ErrorBoundary componentWillUpdate',
        'ErrorBoundary render error',
        'ErrorBoundary componentDidUpdate',
      ] : [
        'ErrorBoundary unstable_handleError',
        // Stack unmounts first, then renders:
        'Normal componentWillUnmount',
        'ErrorBoundary render error',
        // Normal2 does not get lifefycle because it was never mounted
        'ErrorBoundary componentDidUpdate',
      ]),
    ]);

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
    ]);
  });

  it('catches if child throws in componentWillReceiveProps during update', () => {
    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <BrokenComponentWillReceiveProps />
      </ErrorBoundary>,
      container
    );

    log.length = 0;
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <BrokenComponentWillReceiveProps />
      </ErrorBoundary>,
      container
    );
    expect(container.textContent).toBe('Caught an error: Hello.');
    expect(log).toEqual([
      'ErrorBoundary componentWillReceiveProps',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render success',
      'Normal componentWillReceiveProps',
      'Normal componentWillUpdate',
      'Normal render',
      // BrokenComponentWillReceiveProps will abort rendering:
      'BrokenComponentWillReceiveProps componentWillReceiveProps [!]',
      ...(ReactDOMFeatureFlags.useFiber ? [
        // Finish updating with null children
        'Normal componentWillUnmount',
        'BrokenComponentWillReceiveProps componentWillUnmount',
        'ErrorBoundary componentDidUpdate',
        // Handle the error
        'ErrorBoundary unstable_handleError',
        'ErrorBoundary componentWillUpdate',
        'ErrorBoundary render error',
        'ErrorBoundary componentDidUpdate',
      ] : [
        'ErrorBoundary unstable_handleError',
        // Stack unmounts first, then renders:
        'Normal componentWillUnmount',
        'BrokenComponentWillReceiveProps componentWillUnmount',
        'ErrorBoundary render error',
        'ErrorBoundary componentDidUpdate',
      ]),
    ]);

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
    ]);
  });

  it('catches if child throws in componentWillUpdate during update', () => {
    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <BrokenComponentWillUpdate />
      </ErrorBoundary>,
      container
    );

    log.length = 0;
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <BrokenComponentWillUpdate />
      </ErrorBoundary>,
      container
    );
    expect(container.textContent).toBe('Caught an error: Hello.');
    expect(log).toEqual([
      'ErrorBoundary componentWillReceiveProps',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render success',
      'Normal componentWillReceiveProps',
      'Normal componentWillUpdate',
      'Normal render',
      // BrokenComponentWillUpdate will abort rendering:
      'BrokenComponentWillUpdate componentWillReceiveProps',
      'BrokenComponentWillUpdate componentWillUpdate [!]',
      ...(ReactDOMFeatureFlags.useFiber ? [
        // Finish updating with null children
        'Normal componentWillUnmount',
        'BrokenComponentWillUpdate componentWillUnmount',
        'ErrorBoundary componentDidUpdate',
        // Handle the error
        'ErrorBoundary unstable_handleError',
        'ErrorBoundary componentWillUpdate',
        'ErrorBoundary render error',
        'ErrorBoundary componentDidUpdate',
      ] : [
        'ErrorBoundary unstable_handleError',
        // Stack unmounts first, then renders:
        'Normal componentWillUnmount',
        'BrokenComponentWillUpdate componentWillUnmount',
        'ErrorBoundary render error',
        'ErrorBoundary componentDidUpdate',
      ]),
    ]);

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
    ]);
  });

  it('catches if child throws in render during update', () => {
    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
      </ErrorBoundary>,
      container
    );

    log.length = 0;
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <Normal logName="Normal2" />
        <BrokenRender />
      </ErrorBoundary>,
      container
    );
    expect(container.textContent).toBe('Caught an error: Hello.');
    expect(log).toEqual([
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
      ...(ReactDOMFeatureFlags.useFiber ? [
        // Finish updating with null children
        'Normal componentWillUnmount',
        'ErrorBoundary componentDidUpdate',
        // Handle the error
        'ErrorBoundary unstable_handleError',
        'ErrorBoundary componentWillUpdate',
        'ErrorBoundary render error',
        'ErrorBoundary componentDidUpdate',
      ] : [
        'ErrorBoundary unstable_handleError',
        // Stack unmounts first, then renders:
        'Normal componentWillUnmount',
        'ErrorBoundary render error',
        // Normal2 does not get lifefycle because it was never mounted
        'ErrorBoundary componentDidUpdate',
      ]),
    ]);

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
    ]);
  });

  it('keeps refs up-to-date during updates', () => {
    function child1Ref(x) {
      log.push('Child1 ref is set to ' + x);
    }
    function child2Ref(x) {
      log.push('Child2 ref is set to ' + x);
    }
    function errorMessageRef(x) {
      log.push('Error message ref is set to ' + x);
    }

    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary errorMessageRef={errorMessageRef}>
        <div ref={child1Ref} />
      </ErrorBoundary>,
      container
    );
    expect(log).toEqual([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'Child1 ref is set to [object HTMLDivElement]',
      'ErrorBoundary componentDidMount',
    ]);

    log.length = 0;
    ReactDOM.render(
      <ErrorBoundary errorMessageRef={errorMessageRef}>
        <div ref={child1Ref} />
        <div ref={child2Ref} />
        <BrokenRender />
      </ErrorBoundary>,
      container
    );
    expect(container.textContent).toBe('Caught an error: Hello.');
    expect(log).toEqual([
      'ErrorBoundary componentWillReceiveProps',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render success',
      // BrokenRender will abort rendering:
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      ...(ReactDOMFeatureFlags.useFiber ? [
        // Finish updating with null children
        'Child1 ref is set to null',
        'ErrorBoundary componentDidUpdate',
        // Handle the error
        'ErrorBoundary unstable_handleError',
        'ErrorBoundary componentWillUpdate',
        'ErrorBoundary render error',
      ] : [
        'ErrorBoundary unstable_handleError',
        // Stack resets ref first, renders later
        'Child1 ref is set to null',
        'ErrorBoundary render error',
      ]),
      'Error message ref is set to [object HTMLDivElement]',
      // Child2 ref is never set because its mounting aborted
      'ErrorBoundary componentDidUpdate',
    ]);

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
      'Error message ref is set to null',
    ]);
  });

  it('recovers from componentWillUnmount errors on update', () => {
    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenComponentWillUnmount />
        <BrokenComponentWillUnmount />
        <Normal />
      </ErrorBoundary>,
      container
    );

    log.length = 0;
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenComponentWillUnmount />
      </ErrorBoundary>,
      container
    );
    expect(container.textContent).toBe('Caught an error: Hello.');
    expect(log).toEqual([
      'ErrorBoundary componentWillReceiveProps',
      'ErrorBoundary componentWillUpdate',
      'ErrorBoundary render success',
      // Update existing child:
      'BrokenComponentWillUnmount componentWillReceiveProps',
      'BrokenComponentWillUnmount componentWillUpdate',
      'BrokenComponentWillUnmount render',
      // Unmounting throws:
      'BrokenComponentWillUnmount componentWillUnmount [!]',
      ...(ReactDOMFeatureFlags.useFiber ? [
        // Fiber proceeds with lifecycles despite errors
        'Normal componentWillUnmount',
        // The components have updated in this phase
        'BrokenComponentWillUnmount componentDidUpdate',
        'ErrorBoundary componentDidUpdate',
        // Now that commit phase is done, Fiber unmounts the boundary's children
        'BrokenComponentWillUnmount componentWillUnmount [!]',
        'ErrorBoundary unstable_handleError',
        // The initial render was aborted, so
        // Fiber retries from the root.
        'ErrorBoundary componentWillUpdate',
        // Render an error now (stack will do it later)
        'ErrorBoundary render error',
        // Attempt to unmount previous child:
        // Done
        'ErrorBoundary componentDidUpdate',
      ] : [
        // Stack will handle error immediately
        'ErrorBoundary unstable_handleError',
        // Attempt to unmount previous children:
        'BrokenComponentWillUnmount componentWillUnmount [!]',
        'Normal componentWillUnmount',
        // Render an error now (Fiber will do it earlier)
        'ErrorBoundary render error',
        'ErrorBoundary componentDidUpdate',
      ]),
    ]);

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
    ]);
  });

  it('recovers from nested componentWillUnmount errors on update', () => {
    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <Normal>
          <BrokenComponentWillUnmount />
        </Normal>
        <BrokenComponentWillUnmount />
      </ErrorBoundary>,
      container
    );

    log.length = 0;
    ReactDOM.render(
      <ErrorBoundary>
        <Normal>
          <BrokenComponentWillUnmount />
        </Normal>
      </ErrorBoundary>,
      container
    );
    expect(container.textContent).toBe('Caught an error: Hello.');
    expect(log).toEqual([
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
      ...(ReactDOMFeatureFlags.useFiber ? [
        // Fiber proceeds with lifecycles despite errors
        'BrokenComponentWillUnmount componentDidUpdate',
        'Normal componentDidUpdate',
        'ErrorBoundary componentDidUpdate',
        'Normal componentWillUnmount',
        'BrokenComponentWillUnmount componentWillUnmount [!]',
        // Now that commit phase is done, Fiber handles errors
        'ErrorBoundary unstable_handleError',
        // The initial render was aborted, so
        // Fiber retries from the root.
        'ErrorBoundary componentWillUpdate',
        // Render an error now (stack will do it later)
        'ErrorBoundary render error',
        // Done
        'ErrorBoundary componentDidUpdate',
      ] : [
        'ErrorBoundary unstable_handleError',
        // Attempt to unmount previous children:
        'Normal componentWillUnmount',
        'BrokenComponentWillUnmount componentWillUnmount [!]',
        // Stack calls lifecycles first, then renders.
        'ErrorBoundary render error',
        'ErrorBoundary componentDidUpdate',
      ]),
    ]);

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
    ]);
  });

  it('picks the right boundary when handling unmounting errors', () => {
    function renderInnerError(error) {
      return <div>Caught an inner error: {error.message}.</div>;
    }
    function renderOuterError(error) {
      return <div>Caught an outer error: {error.message}.</div>;
    }

    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary logName="OuterErrorBoundary" renderError={renderOuterError}>
        <ErrorBoundary logName="InnerErrorBoundary" renderError={renderInnerError}>
          <BrokenComponentWillUnmount />
        </ErrorBoundary>
      </ErrorBoundary>,
      container
    );

    log.length = 0;
    ReactDOM.render(
      <ErrorBoundary logName="OuterErrorBoundary" renderError={renderOuterError}>
        <ErrorBoundary logName="InnerErrorBoundary" renderError={renderInnerError} />
      </ErrorBoundary>,
      container
    );
    expect(container.textContent).toBe('Caught an inner error: Hello.');
    expect(log).toEqual([
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
      ...(ReactDOMFeatureFlags.useFiber ? [
        // Fiber proceeds with lifecycles despite errors
        // Inner and outer boundaries have updated in this phase
        'InnerErrorBoundary componentDidUpdate',
        'OuterErrorBoundary componentDidUpdate',
        // Now that commit phase is done, Fiber handles errors
        // Only inner boundary receives the error:
        'InnerErrorBoundary unstable_handleError',
        'InnerErrorBoundary componentWillUpdate',
        // Render an error now
        'InnerErrorBoundary render error',
        // In Fiber, this was a local update to the
        // inner boundary so only its hook fires
        'InnerErrorBoundary componentDidUpdate',
      ] : [
        // Stack will handle error immediately
        'InnerErrorBoundary unstable_handleError',
        'InnerErrorBoundary render error',
        // In stack, this was a part of the update to the
        // outer boundary so both lifecycles fire
        'InnerErrorBoundary componentDidUpdate',
        'OuterErrorBoundary componentDidUpdate',
      ]),
    ]);

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'OuterErrorBoundary componentWillUnmount',
      'InnerErrorBoundary componentWillUnmount',
    ]);
  });

  it('can recover from error state', () => {
    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenRender />
      </ErrorBoundary>,
      container
    );

    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
      </ErrorBoundary>,
      container
    );
    // Error boundary doesn't retry by itself:
    expect(container.textContent).toBe('Caught an error: Hello.');

    // Force the success path:
    log.length = 0;
    ReactDOM.render(
      <ErrorBoundary forceRetry={true}>
        <Normal />
      </ErrorBoundary>,
      container
    );
    expect(container.textContent).not.toContain('Caught an error');
    expect(log).toEqual([
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

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
      'Normal componentWillUnmount',
    ]);
  });

  it('can update multiple times in error state', () => {
    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenRender />
      </ErrorBoundary>,
      container
    );
    expect(container.textContent).toBe('Caught an error: Hello.');

    ReactDOM.render(
      <ErrorBoundary>
        <BrokenRender />
      </ErrorBoundary>,
      container
    );
    expect(container.textContent).toBe('Caught an error: Hello.');

    ReactDOM.render(<div>Other screen</div>, container);
    expect(container.textContent).toBe('Other screen');

    ReactDOM.unmountComponentAtNode(container);
  });

  it('doesn\'t get into inconsistent state during removals', () => {
    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <BrokenComponentWillUnmount />
        <Normal />
      </ErrorBoundary>,
      container
    );

    ReactDOM.render(<ErrorBoundary />, container);
    expect(container.textContent).toBe('Caught an error: Hello.');

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
    ]);
  });

  it('doesn\'t get into inconsistent state during additions', () => {
    var container = document.createElement('div');
    ReactDOM.render(<ErrorBoundary />, container);
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <BrokenRender />
        <Normal />
      </ErrorBoundary>,
      container
    );
    expect(container.textContent).toBe('Caught an error: Hello.');

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
    ]);
  });

  it('doesn\'t get into inconsistent state during reorders', () => {
    function getAMixOfNormalAndBrokenRenderElements() {
      var elements = [];
      for (var i = 0; i < 100; i++) {
        elements.push(<Normal key={i} />);
      }
      elements.push(<MaybeBrokenRender key={100} />);

      var currentIndex = elements.length;
      while (0 !== currentIndex) {
        var randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        var temporaryValue = elements[currentIndex];
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

    var fail = false;
    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        {getAMixOfNormalAndBrokenRenderElements()}
      </ErrorBoundary>,
      container
    );
    expect(container.textContent).not.toContain('Caught an error');

    fail = true;
    ReactDOM.render(
      <ErrorBoundary>
        {getAMixOfNormalAndBrokenRenderElements()}
      </ErrorBoundary>,
      container
    );
    expect(container.textContent).toBe('Caught an error: Hello.');

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
    ]);
  });

  // The tests below implement new features in Fiber.
  if (ReactDOMFeatureFlags.useFiber) {
    it('catches errors originating downstream', () => {
      var fail = false;
      class Stateful extends React.Component {
        state = {shouldThrow: false};

        render() {
          if (fail) {
            log.push('Stateful render [!]');
            throw new Error('Hello');
          }
          return <div>{this.props.children}</div>;
        }
      }

      var statefulInst;
      var container = document.createElement('div');
      ReactDOM.render(
        <ErrorBoundary>
          <Stateful ref={inst => statefulInst = inst} />
        </ErrorBoundary>,
        container
      );

      log.length = 0;
      expect(() => {
        fail = true;
        statefulInst.forceUpdate();
      }).not.toThrow();

      expect(log).toEqual([
        'Stateful render [!]',
        'ErrorBoundary unstable_handleError',
        'ErrorBoundary componentWillUpdate',
        'ErrorBoundary render error',
        'ErrorBoundary componentDidUpdate',
      ]);

      log.length = 0;
      ReactDOM.unmountComponentAtNode(container);
      expect(log).toEqual([
        'ErrorBoundary componentWillUnmount',
      ]);
    });

    it('catches errors in componentDidMount', () => {
      var container = document.createElement('div');
      ReactDOM.render(
        <ErrorBoundary>
          <BrokenComponentWillUnmount>
            <Normal />
          </BrokenComponentWillUnmount>
          <BrokenComponentDidMount />
          <Normal logName="LastChild" />
        </ErrorBoundary>,
        container
      );
      expect(log).toEqual([
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
        'ErrorBoundary componentDidMount',
        // Now we are ready to handle the error
        // Safely unmount every child
        'BrokenComponentWillUnmount componentWillUnmount [!]',
        // Continue unmounting safely despite any errors
        'Normal componentWillUnmount',
        'BrokenComponentDidMount componentWillUnmount',
        'LastChild componentWillUnmount',
        // Handle the error
        'ErrorBoundary unstable_handleError',
        'ErrorBoundary componentWillUpdate',
        'ErrorBoundary render error',
        // The update has finished
        'ErrorBoundary componentDidUpdate',
      ]);

      log.length = 0;
      ReactDOM.unmountComponentAtNode(container);
      expect(log).toEqual([
        'ErrorBoundary componentWillUnmount',
      ]);
    });

    it('catches errors in componentDidUpdate', () => {
      var container = document.createElement('div');
      ReactDOM.render(
        <ErrorBoundary>
          <BrokenComponentDidUpdate />
        </ErrorBoundary>,
        container
      );

      log.length = 0;
      ReactDOM.render(
        <ErrorBoundary>
          <BrokenComponentDidUpdate />
        </ErrorBoundary>,
        container
      );
      expect(log).toEqual([
        'ErrorBoundary componentWillReceiveProps',
        'ErrorBoundary componentWillUpdate',
        'ErrorBoundary render success',
        'BrokenComponentDidUpdate componentWillReceiveProps',
        'BrokenComponentDidUpdate componentWillUpdate',
        'BrokenComponentDidUpdate render',
        // All lifecycles run
        'BrokenComponentDidUpdate componentDidUpdate [!]',
        'ErrorBoundary componentDidUpdate',
        'BrokenComponentDidUpdate componentWillUnmount',
        // Then, error is handled
        'ErrorBoundary unstable_handleError',
        'ErrorBoundary componentWillUpdate',
        'ErrorBoundary render error',
        'ErrorBoundary componentDidUpdate',
      ]);

      log.length = 0;
      ReactDOM.unmountComponentAtNode(container);
      expect(log).toEqual([
        'ErrorBoundary componentWillUnmount',
      ]);
    });

    it('propagates errors inside boundary during componentDidMount', () => {
      var container = document.createElement('div');
      ReactDOM.render(
        <ErrorBoundary>
          <BrokenComponentDidMountErrorBoundary
            renderError={error => (
              <div>
                We should never catch our own error: {error.message}.
              </div>
            )} />
        </ErrorBoundary>,
        container
      );
      expect(container.firstChild.textContent).toBe('Caught an error: Hello.');
      expect(log).toEqual([
        'ErrorBoundary constructor',
        'ErrorBoundary componentWillMount',
        'ErrorBoundary render success',
        'BrokenComponentDidMountErrorBoundary constructor',
        'BrokenComponentDidMountErrorBoundary componentWillMount',
        'BrokenComponentDidMountErrorBoundary render success',
        'BrokenComponentDidMountErrorBoundary componentDidMount [!]',
        // Fiber proceeds with the hooks
        'ErrorBoundary componentDidMount',
        'BrokenComponentDidMountErrorBoundary componentWillUnmount',
        // The error propagates to the higher boundary
        'ErrorBoundary unstable_handleError',
        // Fiber retries from the root
        'ErrorBoundary componentWillUpdate',
        'ErrorBoundary render error',
        'ErrorBoundary componentDidUpdate',
      ]);

      log.length = 0;
      ReactDOM.unmountComponentAtNode(container);
      expect(log).toEqual([
        'ErrorBoundary componentWillUnmount',
      ]);
    });

    it('lets different boundaries catch their own first errors', () => {
      function renderUnmountError(error) {
        return <div>Caught an unmounting error: {error.message}.</div>;
      }
      function renderUpdateError(error) {
        return <div>Caught an updating error: {error.message}.</div>;
      }

      var container = document.createElement('div');
      ReactDOM.render(
        <ErrorBoundary logName="OuterErrorBoundary">
          <ErrorBoundary logName="InnerUnmountBoundary" renderError={renderUnmountError}>
            <BrokenComponentWillUnmount errorText="E1" />
            <BrokenComponentWillUnmount errorText="E2" />
          </ErrorBoundary>
          <ErrorBoundary logName="InnerUpdateBoundary" renderError={renderUpdateError}>
            <BrokenComponentDidUpdate errorText="E3" />
            <BrokenComponentDidUpdate errorText="E4" />
          </ErrorBoundary>
        </ErrorBoundary>,
        container
      );

      log.length = 0;
      ReactDOM.render(
        <ErrorBoundary logName="OuterErrorBoundary">
          <ErrorBoundary logName="InnerUnmountBoundary" renderError={renderUnmountError} />
          <ErrorBoundary logName="InnerUpdateBoundary" renderError={renderUpdateError}>
            <BrokenComponentDidUpdate errorText="E3" />
            <BrokenComponentDidUpdate errorText="E4" />
          </ErrorBoundary>
        </ErrorBoundary>,
        container
      );

      expect(container.firstChild.textContent).toBe(
        'Caught an unmounting error: E1.' +
        'Caught an updating error: E3.'
      );
      expect(log).toEqual([
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
        'BrokenComponentDidUpdate componentWillUnmount',
        'BrokenComponentDidUpdate componentWillUnmount',
        'InnerUnmountBoundary unstable_handleError',
        'InnerUpdateBoundary unstable_handleError',
        'InnerUnmountBoundary componentWillUpdate',
        'InnerUnmountBoundary render error',
        'InnerUpdateBoundary componentWillUpdate',
        'InnerUpdateBoundary render error',
        'InnerUnmountBoundary componentDidUpdate',
        'InnerUpdateBoundary componentDidUpdate',
      ]);

      log.length = 0;
      ReactDOM.unmountComponentAtNode(container);
      expect(log).toEqual([
        'OuterErrorBoundary componentWillUnmount',
        'InnerUnmountBoundary componentWillUnmount',
        'InnerUpdateBoundary componentWillUnmount',
      ]);
    });

    it('discards a bad root if the root component fails', () => {
      spyOn(console, 'error');

      const X = null;
      const Y = undefined;
      let err1;
      let err2;

      try {
        let container = document.createElement('div');
        ReactDOM.render(<X />, container);
      } catch (err) {
        err1 = err;
      }
      try {
        let container = document.createElement('div');
        ReactDOM.render(<Y />, container);
      } catch (err) {
        err2 = err;
      }

      expect(err1.message).toMatch(/got: null/);
      expect(err2.message).toMatch(/got: undefined/);
    });

    it('renders empty output if error boundary does not handle the error', () => {
      var container = document.createElement('div');
      ReactDOM.render(
        <div>
          Sibling
          <NoopErrorBoundary>
            <BrokenRender />
          </NoopErrorBoundary>
        </div>,
        container
      );
      expect(container.firstChild.textContent).toBe('Sibling');
      expect(log).toEqual([
        'NoopErrorBoundary constructor',
        'NoopErrorBoundary componentWillMount',
        'NoopErrorBoundary render',
        'BrokenRender constructor',
        'BrokenRender componentWillMount',
        'BrokenRender render [!]',
        // In Fiber, noop error boundaries render null
        'NoopErrorBoundary componentDidMount',
        'NoopErrorBoundary unstable_handleError',
        // Nothing happens.
      ]);

      log.length = 0;
      ReactDOM.unmountComponentAtNode(container);
      expect(log).toEqual([
        'NoopErrorBoundary componentWillUnmount',
      ]);
    });
  }

});
