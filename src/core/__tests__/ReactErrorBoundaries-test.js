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
    EventPluginHub.putListener = jest.fn();
    ReactDOM.render(<Boundary />, container);
    expect(EventPluginHub.putListener).not.toBeCalled();
  });

  it('will catch exceptions in componentWillUnmount initial render', function() {
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
      container
    );
    ReactDOM.unmountComponentAtNode(container);
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
    EventPluginHub.putListener = jest.fn();
    ReactDOM.render(<Boundary />, container);
    expect(EventPluginHub.putListener).toBeCalled();
  });

  it('correctly handles composite siblings', function() {
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
      container
    );
    ReactDOM.unmountComponentAtNode(container);
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

  it('catches errors on update', function() {
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
            {this.props.angry ? <Angry /> : <div />}
          </div>
        );
      }
      unstable_handleError(e) {
        log.push('error handled');
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
    ReactDOM.render(<Box angry={false} />, container);
    ReactDOM.render(<Box angry={true} />, container);
    expect(container.textContent).toBe('Error: Please, do not render me.');
    expect(log).toEqual([
      'Box render',
      'Inquisitive render',
      'Inquisitive componentDidMount',
      'Inquisitive ref [object Object]',
      'Box componentDidMount',
      'Box render',
      'Inquisitive ref null',
      'Inquisitive render',
      'Angry render',
      'error handled',
      'Inquisitive ref null',
      'Inquisitive componentWillUnmount',
      'Box renderError',
    ]);
  });

  it('catches componentWillUnmount errors on update', function() {
    var log = [];

    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {errorMessage: null};
      }
      render() {
        if (this.state.errorMessage != null) {
          log.push('Box renderError');
          return <div>Error: I am now a sad component :(</div>;
        }
        log.push('Box render');

        return (
          <div>
            <BrokenUnmount />
            <BrokenUnmount />
            {this.props.angry ? null : <BrokenUnmount />}
          </div>
        );
      }
      unstable_handleError(e) {
        log.push('error handled');
        this.setState({errorMessage: e.message});
      }
      componentDidMount() {
        log.push('Box componentDidMount');
      }
      componentWillUnmount() {
        log.push('Box componentWillUnmount');
      }
    }

    class BrokenUnmount extends React.Component {
      render() {
        return <div>text</div>;
      }
      componentWillUnmount() {
        log.push('BrokenUnmount is attempting to unmount');
        throw new Error('Always broken.');
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<ErrorBoundary angry={false} />, container);
    ReactDOM.render(<ErrorBoundary angry={true} />, container);
    expect(container.textContent).toBe('Error: I am now a sad component :(');
    expect(log).toEqual([
      'Box render',
      'Box componentDidMount',
      'Box render',
      'BrokenUnmount is attempting to unmount',
      'error handled',
      'BrokenUnmount is attempting to unmount',
      'BrokenUnmount is attempting to unmount',
      'BrokenUnmount is attempting to unmount',
      'Box renderError',
    ]);
    ReactDOM.unmountComponentAtNode(container);
    expect(log).toEqual([
      'Box render',
      'Box componentDidMount',
      'Box render',
      'BrokenUnmount is attempting to unmount',
      'error handled',
      'BrokenUnmount is attempting to unmount',
      'BrokenUnmount is attempting to unmount',
      'BrokenUnmount is attempting to unmount',
      'Box renderError',
      'Box componentWillUnmount',
    ]);
  });

  it('catches componentWillUnmount errors nested children', function() {
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {errorMessage: null};
      }
      render() {
        if (this.state.errorMessage != null) {
          return <div>Error: I am now a sad component :(</div>;
        }

        return (
          <div>
            <InnocentParent />
            {this.props.angry ? null : <InnocentParent />}
          </div>
        );
      }
      unstable_handleError(e) {
        this.setState({errorMessage: e.message});
      }
    }

    class InnocentParent extends React.Component {
      render() {
        return <BrokenUnmount />;
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
    ReactDOM.render(<ErrorBoundary angry={false} />, container);
    ReactDOM.render(<ErrorBoundary angry={true} />, container);
    expect(container.textContent).toBe('Error: I am now a sad component :(');
    ReactDOM.unmountComponentAtNode(container);
  });

  it('doesn\'t get into inconsistent state during removals', function() {
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {errorMessage: null};
      }
      render() {
        if (this.state.errorMessage != null) {
          return <div>Error: I am now a sad component :(</div>;
        }

        return (
          <div>{this.props.children}</div>
        );
      }
      unstable_handleError(e) {
        this.setState({errorMessage: e.message});
      }
    }

    class InnocentComponent extends React.Component {
      render() {
        return <div>text</div>;
      }
    }

    class GuiltyComponent extends React.Component {
      render() {
        return <div>text</div>;
      }
      componentWillUnmount() {
        throw new Error('Always broken.');
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<ErrorBoundary><InnocentComponent /><GuiltyComponent /><InnocentComponent /></ErrorBoundary>, container);
    ReactDOM.render(<ErrorBoundary />, container);
    expect(container.textContent).toBe('Error: I am now a sad component :(');
    ReactDOM.unmountComponentAtNode(container);
  });

  it('doesn\'t get into inconsistent state during additions', function() {
    class ErrorBoundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = {errorMessage: null};
      }
      render() {
        if (this.state.errorMessage != null) {
          return <div>Error: I am now a sad component :(</div>;
        }

        return (
          <div>{this.props.children}</div>
        );
      }
      unstable_handleError(e) {
        this.setState({errorMessage: e.message});
      }
    }

    class InnocentComponent extends React.Component {
      render() {
        return <div>text</div>;
      }
    }

    class GuiltyComponent extends React.Component {
      render() {
        throw new Error('Always broken.');
      }
    }

    var container = document.createElement('div');
    ReactDOM.render(<ErrorBoundary />, container);
    ReactDOM.render(<ErrorBoundary><InnocentComponent /><GuiltyComponent /><InnocentComponent /></ErrorBoundary>, container);
    expect(container.textContent).toBe('Error: I am now a sad component :(');
    ReactDOM.unmountComponentAtNode(container);
  });

  it('doesn\'t get into inconsistent state during reorders', function() {

    function generateElements() {
      var elements = [];
      for (var i = 0; i < 100; i++) {
        elements.push(<InnocentComponent key={i} />);
      }
      elements.push(<GuiltyComponent key={100} />);

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
          return <div>Error: I am now a sad component :(</div>;
        }

        return (
          <div>{this.props.children}</div>
        );
      }
      unstable_handleError(e) {
        this.setState({errorMessage: e.message});
      }
    }

    class InnocentComponent extends React.Component {
      render() {
        return <div>text</div>;
      }
    }

    class GuiltyComponent extends React.Component {
      render() {
        if (fail) {
          throw new Error('Always broken.');
        }
        return <div>text</div>;
      }
    }
    
    var fail = false;

    var container = document.createElement('div');
    ReactDOM.render(<ErrorBoundary>{generateElements()}</ErrorBoundary>, container);
    fail = true;
    ReactDOM.render(<ErrorBoundary>{generateElements()}</ErrorBoundary>, container);

    expect(container.textContent).toBe('Error: I am now a sad component :(');
    ReactDOM.unmountComponentAtNode(container);
  });
});
