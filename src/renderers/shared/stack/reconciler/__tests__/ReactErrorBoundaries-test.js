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
var ReactDOM;

describe('ReactErrorBoundaries', () => {
  beforeEach(() => {
    ReactDOM = require('ReactDOM');
    React = require('React');
  });

  it('does not register event handlers for unmounted children', () => {
    class Angry extends React.Component {
      render() {
        throw new Error('Please, do not render me.');
      }
    }

    class Boundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: false};
      }
      render() {
        if (!this.state.error) {
          return (
            <div><button onClick={this.onClick}>ClickMe</button><Angry /></div>
          );
        } else {
          return <div>Happy Birthday!</div>;
        }
      }
      onClick() {
        /* do nothing */
      }
      unstable_handleError() {
        this.setState({error: true});
      }
    }

    var EventPluginHub = require('EventPluginHub');
    var container = document.createElement('div');
    EventPluginHub.putListener = jest.fn();
    ReactDOM.render(<Boundary />, container);
    expect(EventPluginHub.putListener).not.toBeCalled();
  });

  it('renders an error state', () => {
    var log = [];
    class Angry extends React.Component {
      render() {
        log.push('Angry render');
        throw new Error('Please, do not render me.');
      }
      componentDidMount() {
        log.push('Angry componentDidMount');
      }
      componentWillUnmount() {
        log.push('Angry componentWillUnmount');
      }
    }

    class Boundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: false};
      }
      render() {
        log.push('Boundary render');
        if (!this.state.error) {
          return (
            <div><button onClick={this.onClick}>ClickMe</button><Angry /></div>
          );
        } else {
          return <div>Happy Birthday!</div>;
        }
      }
      componentDidMount() {
        log.push('Boundary componentDidMount');
      }
      componentWillUnmount() {
        log.push('Boundary componentWillUnmount');
      }
      onClick() {
        /* do nothing */
      }
      unstable_handleError() {
        this.setState({error: true});
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<Boundary />, container);
    expect(container.firstChild.innerHTML).toBe('Happy Birthday!');
    expect(log).toEqual([
      'Boundary render',
      'Angry render',
      'Boundary render',
      'Boundary componentDidMount',
    ]);
  });

  it('will catch exceptions in componentWillUnmount', () => {
    class ErrorBoundary extends React.Component {
      constructor() {
        super();
        this.state = {error: false};
      }

      render() {
        if (!this.state.error) {
          return <div>{this.props.children}</div>;
        }
        return <div>Error has been caught</div>;
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
      container,
    );
    ReactDOM.unmountComponentAtNode(container);
  });

  it('expect uneventful render to succeed', () => {
    var log = [];
    class Boundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: false};
      }
      render() {
        log.push('Boundary render');
        return <div><button onClick={this.onClick}>ClickMe</button></div>;
      }
      onClick() {
        /* do nothing */
      }
      componentDidMount() {
        log.push('Boundary componentDidMount');
      }
      componentWillUnmount() {
        log.push('Boundary componentWillUnmount');
      }
      unstable_handleError() {
        this.setState({error: true});
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<Boundary />, container);
    expect(log).toEqual(['Boundary render', 'Boundary componentDidMount']);
  });

  it('correctly handles composite siblings', () => {
    class ErrorBoundary extends React.Component {
      constructor() {
        super();
        this.state = {error: false};
      }

      render() {
        if (!this.state.error) {
          return <div>{this.props.children}</div>;
        }
        return <div>Error has been caught</div>;
      }

      unstable_handleError() {
        this.setState({error: true});
      }
    }

    function Broken() {
      throw new Error('Always broken.');
    }

    function Composite() {
      return <div />;
    }

    var container = document.createElement('div');
    ReactDOM.render(
      <ErrorBoundary><Broken /><Composite /></ErrorBoundary>,
      container,
    );
    ReactDOM.unmountComponentAtNode(container);
  });

  it('catches errors from children', () => {
    var log = [];

    class Box extends React.Component {
      constructor(props) {
        super(props);
        this.state = {errorMessage: null};
      }
      render() {
        if (this.state.errorMessage != null) {
          log.push('Box renderError');
          return <div>Error: {this.state.errorMessage}</div>;
        }
        log.push('Box render');
        var ref = function(x) {
          log.push('Inquisitive ref ' + x);
        };
        return (
          <div>
            <Inquisitive ref={ref} />
            <Angry />
          </div>
        );
      }
      unstable_handleError(e) {
        this.setState({errorMessage: e.message});
      }
      componentDidMount() {
        log.push('Box componentDidMount');
      }
      componentWillUnmount() {
        log.push('Box componentWillUnmount');
      }
    }

    class Inquisitive extends React.Component {
      render() {
        log.push('Inquisitive render');
        return <div>What is love?</div>;
      }
      componentDidMount() {
        log.push('Inquisitive componentDidMount');
      }
      componentWillUnmount() {
        log.push('Inquisitive componentWillUnmount');
      }
    }

    class Angry extends React.Component {
      render() {
        log.push('Angry render');
        throw new Error('Please, do not render me.');
      }
      componentDidMount() {
        log.push('Angry componentDidMount');
      }
      componentWillUnmount() {
        log.push('Angry componentWillUnmount');
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<Box />, container);
    expect(container.textContent).toBe('Error: Please, do not render me.');
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'Box render',
      'Inquisitive render',
      'Angry render',
      'Inquisitive ref null',
      'Inquisitive componentWillUnmount',
      'Box renderError',
      'Box componentDidMount',
      'Box componentWillUnmount',
    ]);
  });
});
