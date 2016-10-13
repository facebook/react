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

var React;
var ReactDOM;

describe('ReactErrorBoundaries', () => {

  beforeEach(() => {
    ReactDOM = require('ReactDOM');
    React = require('React');
  });

  it('renders an error state if child throws in render', () => {
    var log = [];
    class BrokenRender extends React.Component {
      constructor(props) {
        super(props);
        log.push('BrokenRender constructor');
      }
      render() {
        log.push('BrokenRender render [!]');
        throw new Error('Please, do not render me.');
      }
      componentWillMount() {
        log.push('BrokenRender componentWillMount');
      }
      componentDidMount() {
        log.push('BrokenRender componentDidMount');
      }
      componentWillUnmount() {
        log.push('BrokenRender componentWillUnmount');
      }
    }

    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: false};
        log.push('ErrorBoundary constructor');
      }
      render() {
        if (this.state.error) {
          log.push('ErrorBoundary render error');
          return <div>Caught an error.</div>;
        }
        log.push('ErrorBoundary render success');
        return <BrokenRender />;
      }
      componentWillMount() {
        log.push('ErrorBoundary componentWillMount');
      }
      componentDidMount() {
        log.push('ErrorBoundary componentDidMount');
      }
      componentWillUnmount() {
        log.push('ErrorBoundary componentWillUnmount');
      }
      unstable_handleError() {
        log.push('ErrorBoundary unstable_handleError');
        this.setState({error: true});
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<ErrorBoundary />, container);
    expect(container.firstChild.innerHTML).toBe('Caught an error.');
    expect(log).toEqual([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      // Catch and render an error message
      'ErrorBoundary unstable_handleError',
      'ErrorBoundary render error',
      'ErrorBoundary componentDidMount',
    ]);
  });

  it('renders an error state if child throws in constructor', () => {
    var log = [];
    class BrokenConstructor extends React.Component {
      constructor(props) {
        super(props);
        log.push('BrokenConstructor constructor [!]');
        throw new Error('Bad constructor');
      }
      render() {
        log.push('BrokenConstructor render');
      }
      componentWillMount() {
        log.push('BrokenConstructor componentWillMount');
      }
      componentDidMount() {
        log.push('BrokenConstructor componentDidMount');
      }
      componentWillUnmount() {
        log.push('BrokenConstructor componentWillUnmount');
      }
    }

    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: false};
        log.push('ErrorBoundary constructor');
      }
      render() {
        if (this.state.error) {
          log.push('ErrorBoundary render error');
          return <div>Caught an error.</div>;
        }
        log.push('ErrorBoundary render success');
        return <BrokenConstructor />;
      }
      componentWillMount() {
        log.push('ErrorBoundary componentWillMount');
      }
      componentDidMount() {
        log.push('ErrorBoundary componentDidMount');
      }
      componentWillUnmount() {
        log.push('ErrorBoundary componentWillUnmount');
      }
      unstable_handleError() {
        log.push('ErrorBoundary unstable_handleError');
        this.setState({error: true});
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<ErrorBoundary />, container);
    expect(container.firstChild.innerHTML).toBe('Caught an error.');
    expect(log).toEqual([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenConstructor constructor [!]',
      // Catch and render an error message
      'ErrorBoundary unstable_handleError',
      'ErrorBoundary render error',
      'ErrorBoundary componentDidMount',
    ]);
  });

  it('renders an error state if child throws in componentWillMount', () => {
    var log = [];
    class BrokenComponentWillMount extends React.Component {
      constructor(props) {
        super(props);
        log.push('BrokenComponentWillMount constructor');
      }
      componentWillMount() {
        log.push('BrokenComponentWillMount componentWillMount [!]');
        throw new Error('Bad componentWillMount');
      }
      render() {
        log.push('BrokenComponentWillMount render');
      }
      componentDidMount() {
        log.push('BrokenComponentWillMount componentDidMount');
      }
      componentWillUnmount() {
        log.push('BrokenComponentWillMount componentWillUnmount');
      }
    }

    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: false};
        log.push('ErrorBoundary constructor');
      }
      render() {
        if (this.state.error) {
          log.push('ErrorBoundary render error');
          return <div>Caught an error.</div>;
        }
        log.push('ErrorBoundary render success');
        return <BrokenComponentWillMount />;
      }
      componentWillMount() {
        log.push('ErrorBoundary componentWillMount');
      }
      componentDidMount() {
        log.push('ErrorBoundary componentDidMount');
      }
      componentWillUnmount() {
        log.push('ErrorBoundary componentWillUnmount');
      }
      unstable_handleError() {
        log.push('ErrorBoundary unstable_handleError');
        this.setState({error: true});
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<ErrorBoundary />, container);
    expect(container.firstChild.innerHTML).toBe('Caught an error.');
    expect(log).toEqual([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenComponentWillMount constructor',
      'BrokenComponentWillMount componentWillMount [!]',
      // Catch and render an error message
      'ErrorBoundary unstable_handleError',
      'ErrorBoundary render error',
      'ErrorBoundary componentDidMount',
    ]);
  });

  // Known limitation because componentDidMount() does not occur on the stack.
  // We could either hardcode searching for parent boundary, or wait for Fiber.
  it('currently does not catch errors in componentDidMount', () => {
    var log = [];
    class BrokenComponentDidMount extends React.Component {
      constructor(props) {
        super(props);
        log.push('BrokenComponentDidMount constructor');
      }
      componentWillMount() {
        log.push('BrokenComponentDidMount componentWillMount');
      }
      render() {
        log.push('BrokenComponentDidMount render');
        return <div />;
      }
      componentDidMount() {
        log.push('BrokenComponentDidMount componentDidMount [!]');
        throw new Error('Bad componentDidMount.');
      }
      componentWillUnmount() {
        log.push('BrokenComponentDidMount componentWillUnmount');
      }
    }

    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: false};
        log.push('ErrorBoundary constructor');
      }
      render() {
        if (this.state.error) {
          log.push('ErrorBoundary render error');
          return <div>Caught an error.</div>;
        }
        log.push('ErrorBoundary render success');
        return <BrokenComponentDidMount />;
      }
      componentWillMount() {
        log.push('ErrorBoundary componentWillMount');
      }
      componentDidMount() {
        log.push('ErrorBoundary componentDidMount');
      }
      componentWillUnmount() {
        log.push('ErrorBoundary componentWillUnmount');
      }
      unstable_handleError() {
        log.push('ErrorBoundary unstable_handleError');
        this.setState({error: true});
      }
    }

    var container = document.createElement('div');
    expect(() => {
      ReactDOM.render(<ErrorBoundary />, container);
    }).toThrow();
    expect(log).toEqual([
      'ErrorBoundary constructor',
      'ErrorBoundary componentWillMount',
      'ErrorBoundary render success',
      'BrokenComponentDidMount constructor',
      'BrokenComponentDidMount componentWillMount',
      'BrokenComponentDidMount render',
      'BrokenComponentDidMount componentDidMount [!]',
      // FIXME: uncomment when componentDidMount() gets caught.
      // Catch and render an error message
      // 'ErrorBoundary unstable_handleError',
      // 'ErrorBoundary render error',
      // 'ErrorBoundary componentDidMount',
    ]);
  });

  it('propagates errors on retry on mounting', () => {
    var log = [];
    class BrokenRender extends React.Component {
      constructor(props) {
        super(props);
        log.push('BrokenRender constructor');
      }
      render() {
        log.push('BrokenRender render [!]');
        throw new Error('Please, do not render me.');
      }
      componentWillMount() {
        log.push('BrokenRender componentWillMount');
      }
      componentDidMount() {
        log.push('BrokenRender componentDidMount');
      }
      componentWillUnmount() {
        log.push('BrokenRender componentWillUnmount');
      }
    }

    class UncatchingErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        log.push('UncatchingErrorBoundary constructor');
      }
      render() {
        log.push('UncatchingErrorBoundary render');
        return <BrokenRender />;
      }
      componentWillMount() {
        log.push('UncatchingErrorBoundary componentWillMount');
      }
      componentDidMount() {
        log.push('UncatchingErrorBoundary componentDidMount');
      }
      componentWillUnmount() {
        log.push('UncatchingErrorBoundary componentWillUnmount');
      }
      unstable_handleError() {
        log.push('UncatchingErrorBoundary unstable_handleError');
      }
    }

    class ParentErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: false};
        log.push('ParentErrorBoundary constructor');
      }
      render() {
        if (this.state.error) {
          log.push('ParentErrorBoundary render error');
          return <div>Caught an error.</div>;
        }
        log.push('ParentErrorBoundary render success');
        return <UncatchingErrorBoundary />;
      }
      componentWillMount() {
        log.push('ParentErrorBoundary componentWillMount');
      }
      componentDidMount() {
        log.push('ParentErrorBoundary componentDidMount');
      }
      componentWillUnmount() {
        log.push('ParentErrorBoundary componentWillUnmount');
      }
      unstable_handleError() {
        log.push('ParentErrorBoundary unstable_handleError');
        this.setState({error: true});
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<ParentErrorBoundary />, container);
    expect(container.firstChild.innerHTML).toBe('Caught an error.');
    expect(log).toEqual([
      'ParentErrorBoundary constructor',
      'ParentErrorBoundary componentWillMount',
      'ParentErrorBoundary render success',
      'UncatchingErrorBoundary constructor',
      'UncatchingErrorBoundary componentWillMount',
      'UncatchingErrorBoundary render',
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      // The first error boundary catches the error
      // However, it doesn't adjust its state so next render also fails
      'UncatchingErrorBoundary unstable_handleError',
      'UncatchingErrorBoundary render',
      'BrokenRender constructor',
      'BrokenRender componentWillMount',
      'BrokenRender render [!]',
      // This time, the error propagates to the higher boundary
      'ParentErrorBoundary unstable_handleError',
      // Clean up the broken tree
      'UncatchingErrorBoundary componentWillUnmount',
      // Render the error
      'ParentErrorBoundary render error',
      'ParentErrorBoundary componentDidMount',
    ]);
  });

  it('propagates errors inside boundary itself on mounting', () => {
    var log = [];
    class BrokenRender extends React.Component {
      render() {
        log.push('BrokenRender render [!]');
        throw new Error('Please, do not render me.');
      }
      componentDidMount() {
        log.push('BrokenRender componentDidMount');
      }
      componentWillUnmount() {
        log.push('BrokenRender componentWillUnmount');
      }
    }

    class BrokenErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: false};
      }
      render() {
        if (this.state.error) {
          log.push('BrokenErrorBoundary render error [!]');
          throw new Error('You shall not pass.');
        }
        log.push('BrokenErrorBoundary render success');
        return <BrokenRender />;
      }
      componentDidMount() {
        log.push('BrokenErrorBoundary componentDidMount');
      }
      componentWillUnmount() {
        log.push('BrokenErrorBoundary componentWillUnmount');
      }
      unstable_handleError() {
        log.push('BrokenErrorBoundary unstable_handleError');
        this.setState({error: true});
      }
    }

    class ParentErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: false};
      }
      render() {
        if (this.state.error) {
          log.push('ParentErrorBoundary render error');
          return <div>Caught an error.</div>;
        }
        log.push('ParentErrorBoundary render success');
        return <BrokenErrorBoundary />;
      }
      componentDidMount() {
        log.push('ParentErrorBoundary componentDidMount');
      }
      componentWillUnmount() {
        log.push('ParentErrorBoundary componentWillUnmount');
      }
      unstable_handleError() {
        log.push('ParentErrorBoundary unstable_handleError');
        this.setState({error: true});
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<ParentErrorBoundary />, container);
    expect(container.firstChild.innerHTML).toBe('Caught an error.');
    expect(log).toEqual([
      'ParentErrorBoundary render success',
      'BrokenErrorBoundary render success',
      'BrokenRender render [!]',
      // The first error boundary catches the error
      // It adjusts state but throws displaying the message
      'BrokenErrorBoundary unstable_handleError',
      'BrokenErrorBoundary render error [!]',
      // The error propagates to the higher boundary
      'ParentErrorBoundary unstable_handleError',
      // Clean up the broken tree
      'BrokenErrorBoundary componentWillUnmount',
      // Render the error
      'ParentErrorBoundary render error',
      'ParentErrorBoundary componentDidMount',
    ]);
  });

  it('does not register event handlers for unmounted children', () => {
    class BrokenRender extends React.Component {
      render() {
        throw new Error('Please, do not render me.');
      }
    }

    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: false};
      }
      render() {
        if (this.state.error) {
          return <div>Caught an error.</div>;
        }
        return (
          <div>
            <button onClick={this.handleClick}>Click me</button>
            <BrokenRender />
          </div>
        );
      }
      handleClick() {
        /* do nothing */
      }
      unstable_handleError() {
        this.setState({error: true});
      }
    }

    var EventPluginHub = require('EventPluginHub');
    var container = document.createElement('div');
    EventPluginHub.putListener = jest.fn();
    ReactDOM.render(<ErrorBoundary />, container);
    expect(EventPluginHub.putListener).not.toBeCalled();
  });

  it('catches errors in componentWillUnmount during mounting rollback', () => {
    var log = [];
    class ErrorBoundary extends React.Component {
      constructor() {
        super();
        this.state = {error: false};
      }
      render() {
        if (this.state.error) {
          log.push('ErrorBoundary render error');
          return <div>Caught an error.</div>;
        }
        log.push('ErrorBoundary render success');
        return <div>{this.props.children}</div>;
      }
      unstable_handleError() {
        log.push('ErrorBoundary unstable_handleError');
        this.setState({error: true});
      }
    }

    class BrokenRender extends React.Component {
      render() {
        log.push('BrokenRender render [!]');
        throw new Error('Always broken.');
      }
    }

    class BrokenUnmount extends React.Component {
      render() {
        log.push('BrokenUnmount render');
        return <div />;
      }
      componentWillUnmount() {
        log.push('BrokenUnmount componentWillUnmount [!]');
        throw new Error('Always broken.');
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenUnmount />
        <BrokenRender />
        <BrokenUnmount />
      </ErrorBoundary>,
      container
    );
    expect(container.firstChild.innerHTML).toBe('Caught an error.');
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary render success',
      'BrokenUnmount render',
      'BrokenRender render [!]',
      'ErrorBoundary unstable_handleError',
      'BrokenUnmount componentWillUnmount [!]',
      'ErrorBoundary render error',
    ]);
  });

  it('successfully mounts if no error occurs', () => {
    var log = [];
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: false};
      }
      render() {
        log.push('ErrorBoundary render');
        if (this.state.error) {
          return <div>Caught an error.</div>;
        }
        return <div>Mounted successfully.</div>;
      }
      componentDidMount() {
        log.push('ErrorBoundary componentDidMount');
      }
      componentWillUnmount() {
        log.push('ErrorBoundary componentWillUnmount');
      }
      unstable_handleError() {
        this.setState({error: true});
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<ErrorBoundary />, container);
    expect(container.firstChild.innerHTML).toBe('Mounted successfully.');
    expect(log).toEqual([
      'ErrorBoundary render',
      'ErrorBoundary componentDidMount',
    ]);
  });

  it('rolls back mounting composite siblings if one of them throws', () => {
    class ErrorBoundary extends React.Component {
      constructor() {
        super();
        this.state = {error: false};
      }
      render() {
        if (this.state.error) {
          return <div>Caught an error.</div>;
        }
        return <div>{this.props.children}</div>;
      }
      unstable_handleError() {
        this.setState({error: true});
      }
    }

    function BrokenRender() {
      throw new Error('Always broken.');
    }

    function Normal() {
      return <div />;
    }

    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <BrokenRender />
        <Normal />
      </ErrorBoundary>,
      container
    );
    expect(container.firstChild.innerHTML).toBe('Caught an error.');
    ReactDOM.unmountComponentAtNode(container);
  });

  it('resets refs to composite siblings if one of them throws', () => {
    var log = [];

    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {errorMessage: null};
      }
      render() {
        if (this.state.errorMessage != null) {
          log.push('ErrorBoundary renderError');
          return <div>Caught an error: {this.state.errorMessage}</div>;
        }
        log.push('ErrorBoundary render');
        var ref = function(x) {
          log.push('ErrorBoundary ref to Normal is set to ' + x);
        };
        return (
          <div>
            <Normal ref={ref} />
            <BrokenRender />
          </div>
        );
      }
      unstable_handleError(e) {
        this.setState({errorMessage: e.message});
      }
      componentDidMount() {
        log.push('ErrorBoundary componentDidMount');
      }
      componentWillUnmount() {
        log.push('ErrorBoundary componentWillUnmount');
      }
    }

    class Normal extends React.Component {
      render() {
        log.push('Normal render');
        return <div>What is love?</div>;
      }
      componentDidMount() {
        log.push('Normal componentDidMount');
      }
      componentWillUnmount() {
        log.push('Normal componentWillUnmount');
      }
    }

    class BrokenRender extends React.Component {
      render() {
        log.push('BrokenRender render [!]');
        throw new Error('Please, do not render me.');
      }
      componentDidMount() {
        log.push('BrokenRender componentDidMount');
      }
      componentWillUnmount() {
        log.push('BrokenRender componentWillUnmount');
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<ErrorBoundary />, container);
    expect(container.textContent).toBe('Caught an error: Please, do not render me.');
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary render',
      'Normal render',
      'BrokenRender render [!]',
      'ErrorBoundary ref to Normal is set to null',
      'Normal componentWillUnmount',
      'ErrorBoundary renderError',
      'ErrorBoundary componentDidMount',
      'ErrorBoundary componentWillUnmount',
    ]);
  });

  it('catches if child throws in render during update', () => {
    var log = [];

    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {errorMessage: null};
      }
      render() {
        if (this.state.errorMessage != null) {
          log.push('ErrorBoundary renderError');
          return (
            <ErrorMessage
              message={this.state.errorMessage}
              ref={inst => {
                log.push('ErrorBoundary ref to ErrorMessage is set to ' + inst);
              }} />
          );
        }
        log.push('ErrorBoundary render');
        return (
          <div>
            <Normal ref={inst => {
              log.push('ErrorBoundary ref to Normal is set to ' + inst);
            }} />
            {this.props.renderBrokenChild ? <BrokenRender /> : <div />}
          </div>
        );
      }
      unstable_handleError(e) {
        log.push('ErrorBoundary unstable_handleError');
        this.setState({errorMessage: e.message});
      }
      componentDidMount() {
        log.push('ErrorBoundary componentDidMount');
      }
      componentWillUnmount() {
        log.push('ErrorBoundary componentWillUnmount');
      }
    }

    class ErrorMessage extends React.Component {
      componentWillMount() {
        log.push('ErrorMessage componentWillMount');
      }
      componentDidMount() {
        log.push('ErrorMessage componentDidMount');
      }
      render() {
        log.push('ErrorMessage render');
        return <div>Caught an error: {this.props.message}</div>;
      }
    }

    class Normal extends React.Component {
      render() {
        log.push('Normal render');
        return <div>What is love?</div>;
      }
      componentDidMount() {
        log.push('Normal componentDidMount');
      }
      componentWillUnmount() {
        log.push('Normal componentWillUnmount');
      }
    }

    class BrokenRender extends React.Component {
      render() {
        log.push('BrokenRender render [!]');
        throw new Error('Please, do not render me.');
      }
      componentDidMount() {
        log.push('BrokenRender componentDidMount');
      }
      componentWillUnmount() {
        log.push('BrokenRender componentWillUnmount');
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<ErrorBoundary renderBrokenChild={false} />, container);
    expect(log).toEqual([
      'ErrorBoundary render',
      'Normal render',
      'Normal componentDidMount',
      'ErrorBoundary ref to Normal is set to [object Object]',
      'ErrorBoundary componentDidMount',
    ]);

    log.length = 0;
    ReactDOM.render(<ErrorBoundary renderBrokenChild={true} />, container);
    expect(container.textContent).toBe('Caught an error: Please, do not render me.');
    expect(log).toEqual([
      'ErrorBoundary render',
      'ErrorBoundary ref to Normal is set to null',
      'Normal render',
      'BrokenRender render [!]',
      'ErrorBoundary unstable_handleError',
      'ErrorBoundary ref to Normal is set to null',
      'Normal componentWillUnmount',
      'ErrorBoundary renderError',
      'ErrorMessage componentWillMount',
      'ErrorMessage render',
      'ErrorMessage componentDidMount',
      'ErrorBoundary ref to ErrorMessage is set to [object Object]',
    ]);
  });

  it('recovers from componentWillUnmount errors on update', () => {
    var log = [];

    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {errorMessage: null};
      }
      render() {
        if (this.state.errorMessage != null) {
          log.push('ErrorBoundary renderError');
          return <div>Caught an error.</div>;
        }
        log.push('ErrorBoundary render');
        return (
          <div>
            <BrokenUnmount />
            <BrokenUnmount />
            {this.props.renderChildWithBrokenUnmount &&
              <BrokenUnmount />
            }
          </div>
        );
      }
      unstable_handleError(e) {
        log.push('ErrorBoundary unstable_handleError');
        this.setState({errorMessage: e.message});
      }
      componentDidMount() {
        log.push('ErrorBoundary componentDidMount');
      }
      componentWillUnmount() {
        log.push('ErrorBoundary componentWillUnmount');
      }
    }

    class BrokenUnmount extends React.Component {
      render() {
        return <div>text</div>;
      }
      componentWillUnmount() {
        log.push('BrokenUnmount componentWillUnmount [!]');
        throw new Error('Always broken.');
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary renderChildWithBrokenUnmount={true} />,
      container
    );
    ReactDOM.render(
      <ErrorBoundary renderChildWithBrokenUnmount={false} />,
      container
    );
    expect(container.textContent).toBe('Caught an error.');
    expect(log).toEqual([
      'ErrorBoundary render',
      'ErrorBoundary componentDidMount',
      'ErrorBoundary render',
      'BrokenUnmount componentWillUnmount [!]',
      'ErrorBoundary unstable_handleError',
      'BrokenUnmount componentWillUnmount [!]',
      'BrokenUnmount componentWillUnmount [!]',
      'ErrorBoundary renderError',
    ]);

    log.length = 0;
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'ErrorBoundary componentWillUnmount',
    ]);
  });

  it('recovers from nested componentWillUnmount errors on update', () => {
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {errorMessage: null};
      }
      render() {
        if (this.state.errorMessage != null) {
          return <div>Caught an error: {this.state.errorMessage}</div>;
        }
        return (
          <div>
            <RenderBrokenUnmount />
            {this.props.renderChildWithBrokenUnmount &&
              <RenderBrokenUnmount />
            }
          </div>
        );
      }
      unstable_handleError(e) {
        this.setState({errorMessage: e.message});
      }
    }

    class RenderBrokenUnmount extends React.Component {
      render() {
        return <BrokenUnmount />;
      }
    }

    class BrokenUnmount extends React.Component {
      render() {
        return <div>text</div>;
      }
      componentWillUnmount() {
        throw new Error('I am broken.');
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary renderChildWithBrokenUnmount={true} />,
      container
    );
    ReactDOM.render(
      <ErrorBoundary renderChildWithBrokenUnmount={false} />,
      container
    );
    expect(container.textContent).toBe(
      'Caught an error: I am broken.'
    );
    ReactDOM.unmountComponentAtNode(container);
  });

  it('doesn\'t get into inconsistent state during removals', () => {
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {errorMessage: null};
      }
      render() {
        if (this.state.errorMessage != null) {
          return <div>Caught an error.</div>;
        }
        return (
          <div>{this.props.children}</div>
        );
      }
      unstable_handleError(e) {
        this.setState({errorMessage: e.message});
      }
    }

    class Normal extends React.Component {
      render() {
        return <div>text</div>;
      }
    }

    class BrokenUnmount extends React.Component {
      render() {
        return <div>text</div>;
      }
      componentWillUnmount() {
        throw new Error('Always broken.');
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary>
        <Normal />
        <BrokenUnmount />
        <Normal />
      </ErrorBoundary>,
      container
    );
    ReactDOM.render(<ErrorBoundary />, container);
    expect(container.textContent).toBe('Caught an error.');
    ReactDOM.unmountComponentAtNode(container);
  });

  it('doesn\'t get into inconsistent state during additions', () => {
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {errorMessage: null};
      }
      render() {
        if (this.state.errorMessage != null) {
          return <div>Caught an error.</div>;
        }
        return (
          <div>{this.props.children}</div>
        );
      }
      unstable_handleError(e) {
        this.setState({errorMessage: e.message});
      }
    }

    class Normal extends React.Component {
      render() {
        return <div>text</div>;
      }
    }

    class BrokenRender extends React.Component {
      render() {
        throw new Error('Always broken.');
      }
    }

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
    expect(container.textContent).toBe('Caught an error.');
    ReactDOM.unmountComponentAtNode(container);
  });

  it('doesn\'t get into inconsistent state during reorders', () => {
    function getAMixOfNormalAndBrokenRenderElements() {
      var elements = [];
      for (var i = 0; i < 100; i++) {
        elements.push(<Normal key={i} />);
      }
      elements.push(<BrokenRender key={100} />);

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

    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {errorMessage: null};
      }
      render() {
        if (this.state.errorMessage != null) {
          return <div>Caught an error.</div>;
        }

        return (
          <div>{this.props.children}</div>
        );
      }
      unstable_handleError(e) {
        this.setState({errorMessage: e.message});
      }
    }

    class Normal extends React.Component {
      render() {
        return <div>text</div>;
      }
    }

    class BrokenRender extends React.Component {
      render() {
        if (fail) {
          throw new Error('Always broken.');
        }
        return <div>text</div>;
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
    expect(container.textContent).not.toBe('Caught an error.');

    fail = true;
    ReactDOM.render(
      <ErrorBoundary>
        {getAMixOfNormalAndBrokenRenderElements()}
      </ErrorBoundary>,
      container
    );
    expect(container.textContent).toBe('Caught an error.');
    ReactDOM.unmountComponentAtNode(container);
  });
});
