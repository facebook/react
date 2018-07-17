/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const ReactDOMServerIntegrationUtils = require('./utils/ReactDOMServerIntegrationTestUtils');

let React;
let ReactDOMServer;

function initModules() {
  // Reset warning cache.
  jest.resetModuleRegistry();
  React = require('react');
  ReactDOMServer = require('react-dom/server');

  // Make them available to the helpers.
  return {
    ReactDOMServer,
  };
}

const {resetModules} = ReactDOMServerIntegrationUtils(initModules);

describe('ReactDOMServerLifecycles', () => {
  beforeEach(() => {
    resetModules();
  });

  it('should invoke the correct legacy lifecycle hooks', () => {
    const log = [];

    class Outer extends React.Component {
      UNSAFE_componentWillMount() {
        log.push('outer componentWillMount');
      }
      render() {
        log.push('outer render');
        return <Inner />;
      }
    }

    class Inner extends React.Component {
      UNSAFE_componentWillMount() {
        log.push('inner componentWillMount');
      }
      render() {
        log.push('inner render');
        return null;
      }
    }

    ReactDOMServer.renderToString(<Outer />);
    expect(log).toEqual([
      'outer componentWillMount',
      'outer render',
      'inner componentWillMount',
      'inner render',
    ]);
  });

  it('should invoke the correct new lifecycle hooks', () => {
    const log = [];

    class Outer extends React.Component {
      state = {};
      static getDerivedStateFromProps() {
        log.push('outer getDerivedStateFromProps');
        return null;
      }
      render() {
        log.push('outer render');
        return <Inner />;
      }
    }

    class Inner extends React.Component {
      state = {};
      static getDerivedStateFromProps() {
        log.push('inner getDerivedStateFromProps');
        return null;
      }
      render() {
        log.push('inner render');
        return null;
      }
    }

    ReactDOMServer.renderToString(<Outer />);
    expect(log).toEqual([
      'outer getDerivedStateFromProps',
      'outer render',
      'inner getDerivedStateFromProps',
      'inner render',
    ]);
  });

  it('should not invoke unsafe cWM if static gDSFP is present', () => {
    class Component extends React.Component {
      state = {};
      static getDerivedStateFromProps() {
        return null;
      }
      UNSAFE_componentWillMount() {
        throw Error('unexpected');
      }
      render() {
        return null;
      }
    }

    ReactDOMServer.renderToString(<Component />);
  });

  it('should update instance.state with value returned from getDerivedStateFromProps', () => {
    class Grandparent extends React.Component {
      state = {
        foo: 'foo',
      };
      render() {
        return (
          <div>
            {`Grandparent: ${this.state.foo}`}
            <Parent />
          </div>
        );
      }
    }

    class Parent extends React.Component {
      state = {
        bar: 'bar',
        baz: 'baz',
      };
      static getDerivedStateFromProps(props, prevState) {
        return {
          bar: `not ${prevState.bar}`,
        };
      }
      render() {
        return (
          <div>
            {`Parent: ${this.state.bar}, ${this.state.baz}`}
            <Child />;
          </div>
        );
      }
    }

    class Child extends React.Component {
      state = {};
      static getDerivedStateFromProps() {
        return {
          qux: 'qux',
        };
      }
      render() {
        return `Child: ${this.state.qux}`;
      }
    }

    const markup = ReactDOMServer.renderToString(<Grandparent />);
    expect(markup).toContain('Grandparent: foo');
    expect(markup).toContain('Parent: not bar, baz');
    expect(markup).toContain('Child: qux');
  });

  it('should warn if getDerivedStateFromProps returns undefined', () => {
    class Component extends React.Component {
      state = {};
      static getDerivedStateFromProps() {}
      render() {
        return null;
      }
    }

    expect(() => ReactDOMServer.renderToString(<Component />)).toWarnDev(
      'Component.getDerivedStateFromProps(): A valid state object (or null) must ' +
        'be returned. You have returned undefined.',
      {withoutStack: true},
    );

    // De-duped
    ReactDOMServer.renderToString(<Component />);
  });

  it('should warn if state is not initialized before getDerivedStateFromProps', () => {
    class Component extends React.Component {
      static getDerivedStateFromProps() {
        return null;
      }
      render() {
        return null;
      }
    }

    expect(() => ReactDOMServer.renderToString(<Component />)).toWarnDev(
      'Component: Did not properly initialize state during construction. ' +
        'Expected state to be an object, but it was undefined.',
      {withoutStack: true},
    );

    // De-duped
    ReactDOMServer.renderToString(<Component />);
  });

  it('should invoke both deprecated and new lifecycles if both are present', () => {
    const log = [];

    class Component extends React.Component {
      componentWillMount() {
        log.push('componentWillMount');
      }
      UNSAFE_componentWillMount() {
        log.push('UNSAFE_componentWillMount');
      }
      render() {
        return null;
      }
    }

    ReactDOMServer.renderToString(<Component />);
    expect(log).toEqual(['componentWillMount', 'UNSAFE_componentWillMount']);
  });

  it('tracks state updates across components', () => {
    class Outer extends React.Component {
      UNSAFE_componentWillMount() {
        this.setState({x: 1});
      }
      render() {
        return <Inner updateParent={this.updateParent}>{this.state.x}</Inner>;
      }
      updateParent = () => {
        this.setState({x: 3});
      };
    }
    class Inner extends React.Component {
      UNSAFE_componentWillMount() {
        this.setState({x: 2});
        this.props.updateParent();
      }
      render() {
        return <div>{this.props.children + '-' + this.state.x}</div>;
      }
    }
    expect(() => {
      // Shouldn't be 1-3.
      expect(ReactDOMServer.renderToStaticMarkup(<Outer />)).toBe(
        '<div>1-2</div>',
      );
    }).toWarnDev(
      'Warning: setState(...): Can only update a mounting component. This ' +
        'usually means you called setState() outside componentWillMount() on ' +
        'the server. This is a no-op.\n\n' +
        'Please check the code for the Outer component.',
      {withoutStack: true},
    );
  });
});
