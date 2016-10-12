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

  it('renders an error state if child throws rendering', () => {
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
        return (
          <div>
            <button onClick={this.handleClick}>Click me</button>
            <BrokenRender />
          </div>
        );
      }
      componentDidMount() {
        log.push('ErrorBoundary componentDidMount');
      }
      componentWillUnmount() {
        log.push('ErrorBoundary componentWillUnmount');
      }
      handleClick() {
        /* do nothing */
      }
      unstable_handleError() {
        this.setState({error: true});
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<ErrorBoundary />, container);
    expect(container.firstChild.innerHTML).toBe('Caught an error.');
    expect(log).toEqual([
      'ErrorBoundary render',
      'BrokenRender render [!]',
      'ErrorBoundary render',
      'ErrorBoundary componentDidMount',
    ]);
  });

  it('catches errors in componentWillUnmount during mounting rollback', () => {
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

    class BrokenRender extends React.Component {
      render() {
        throw new Error('Always broken.');
      }
    }

    class BrokenUnmount extends React.Component {
      render() {
        return <div />;
      }
      componentWillUnmount() {
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
          return <div>Caught an error: {this.state.errorMessage}</div>;
        }
        log.push('ErrorBoundary render');
        var ref = function(x) {
          log.push('ErrorBoundary ref to Normal is set to ' + x);
        };
        return (
          <div>
            <Normal ref={ref} />
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
