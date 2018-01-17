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

  it('should invoke the correct lifecycle hooks', () => {
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

  it('should warn about deprecated lifecycle hooks', () => {
    class Component extends React.Component {
      componentWillMount() {}
      render() {
        return null;
      }
    }

    expect(() => ReactDOMServer.renderToString(<Component />)).toWarnDev(
      'Warning: Component: componentWillMount() is deprecated and will be removed ' +
        'in the next major version. Please use UNSAFE_componentWillMount() instead.',
    );

    // De-duped
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
      static getDerivedStateFromProps() {}
      render() {
        return null;
      }
    }

    expect(() => ReactDOMServer.renderToString(<Component />)).toWarnDev(
      'Component.getDerivedStateFromProps(): A valid state object (or null) must ' +
        'be returned. You may have returned undefined.',
    );

    // De-duped
    ReactDOMServer.renderToString(<Component />);
  });
});
