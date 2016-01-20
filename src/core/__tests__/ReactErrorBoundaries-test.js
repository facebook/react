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

describe('ReactErrorBoundaries', function() {

  beforeEach(function() {
    ReactDOM = require('ReactDOM');
    React = require('React');
  });

  it('does not register event handlers for unmounted children', function() {
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
          return (<div><button onClick={this.onClick}>ClickMe</button><Angry /></div>);
        } else {
          return (<div>Happy Birthday!</div>);
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
    EventPluginHub.putListener = jest.genMockFn();
    ReactDOM.render(<Boundary />, container);
    expect(EventPluginHub.putListener).not.toBeCalled();
  });

  it('expect uneventful render to succeed', function() {
    class Boundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {error: false};
      }
      render() {
        return (<div><button onClick={this.onClick}>ClickMe</button></div>);
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
    EventPluginHub.putListener = jest.genMockFn();
    ReactDOM.render(<Boundary />, container);
    expect(EventPluginHub.putListener).toBeCalled();
  });


  it('catches errors from children', function() {
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
    expect(log).toEqual([
      'Box render',
      'Inquisitive render',
      'Angry render',
      'Inquisitive ref null',
      'Inquisitive componentWillUnmount',
      'Angry componentWillUnmount',
      'Box renderError',
      'Box componentDidMount',
    ]);
  });
});
