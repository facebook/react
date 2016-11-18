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

var React = require('React');
var ReactDOM = require('ReactDOM');
var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
var ReactTestUtils = require('ReactTestUtils');
var renderSubtreeIntoContainer = require('renderSubtreeIntoContainer');

describe('renderSubtreeIntoContainer', () => {

  it('should pass context when rendering subtree elsewhere', () => {
    var portalContainer = document.createElement('div');

    class Component extends React.Component {
      static contextTypes = {
        foo: React.PropTypes.string.isRequired,
      };

      render() {
        return <div>{this.context.foo}</div>;
      }
    }

    let Parent;
    if (ReactDOMFeatureFlags.useFiber) {
      Parent = class extends React.Component {
        static childContextTypes = {
          foo: React.PropTypes.string.isRequired,
        };

        getChildContext() {
          return {
            foo: 'bar',
          };
        }

        render() {
          return ReactDOM.unstable_createPortal(
            <Component />,
            portalContainer
          );
        }
      }
    } else {
      Parent = class extends React.Component {
        static childContextTypes = {
          foo: React.PropTypes.string.isRequired,
        };

        getChildContext() {
          return {
            foo: 'bar',
          };
        }

        render() {
          return null;
        }

        componentDidMount() {
          expect(function() {
            renderSubtreeIntoContainer(this, <Component />, portalContainer);
          }.bind(this)).not.toThrow();
        }
      }
    }

    ReactTestUtils.renderIntoDocument(<Parent />);
    expect(portalContainer.firstChild.innerHTML).toBe('bar');
  });

  if (!ReactDOMFeatureFlags.useFiber) {
    // This test is only relevant for imperative API
    it('should throw if parentComponent is invalid', () => {
      var portalContainer = document.createElement('div');

      class Component extends React.Component {
        static contextTypes = {
          foo: React.PropTypes.string.isRequired,
        };

        render() {
          return <div>{this.context.foo}</div>;
        }
      }

      // ESLint is confused here and thinks Parent is unused, presumably because
      // it is only used inside of the class body?
      // eslint-disable-next-line no-unused-vars
      class Parent extends React.Component {
        static childContextTypes = {
          foo: React.PropTypes.string.isRequired,
        };

        getChildContext() {
          return {
            foo: 'bar',
          };
        }

        render() {
          return null;
        }

        componentDidMount() {
          expect(function() {
            renderSubtreeIntoContainer(<Parent />, <Component />, portalContainer);
          }).toThrowError('parentComponentmust be a valid React Component');
        }
      }
    });
  }

  it('should update context if it changes due to setState', () => {
    var container = document.createElement('div');
    document.body.appendChild(container);
    var portalContainer = document.createElement('div');

    class Component extends React.Component {
      static contextTypes = {
        foo: React.PropTypes.string.isRequired,
        getFoo: React.PropTypes.func.isRequired,
      };

      render() {
        return <div>{this.context.foo + '-' + this.context.getFoo()}</div>;
      }
    }

    let Parent;
    if (ReactDOMFeatureFlags.useFiber) {
      Parent = class extends React.Component {
        static childContextTypes = {
          foo: React.PropTypes.string.isRequired,
          getFoo: React.PropTypes.func.isRequired,
        };

        state = {
          bar: 'initial',
        };

        getChildContext() {
          return {
            foo: this.state.bar,
            getFoo: () => this.state.bar,
          };
        }

        render() {
          return ReactDOM.unstable_createPortal(
            <Component />,
            portalContainer
          );
        }
      }
    } else {
      Parent = class extends React.Component {
        static childContextTypes = {
          foo: React.PropTypes.string.isRequired,
          getFoo: React.PropTypes.func.isRequired,
        };

        state = {
          bar: 'initial',
        };

        getChildContext() {
          return {
            foo: this.state.bar,
            getFoo: () => this.state.bar,
          };
        }

        render() {
          return null;
        }

        componentDidMount() {
          renderSubtreeIntoContainer(this, <Component />, portalContainer);
        }

        componentDidUpdate() {
          renderSubtreeIntoContainer(this, <Component />, portalContainer);
        }
      }
    }

    var instance = ReactDOM.render(<Parent />, container);
    expect(portalContainer.firstChild.innerHTML).toBe('initial-initial');
    instance.setState({bar: 'changed'});
    expect(portalContainer.firstChild.innerHTML).toBe('changed-changed');
  });

  it('should update context if it changes due to re-render', () => {
    var container = document.createElement('div');
    document.body.appendChild(container);
    var portalContainer = document.createElement('div');

    class Component extends React.Component {
      static contextTypes = {
        foo: React.PropTypes.string.isRequired,
        getFoo: React.PropTypes.func.isRequired,
      };

      render() {
        return <div>{this.context.foo + '-' + this.context.getFoo()}</div>;
      }
    }

    let Parent;
    if (ReactDOMFeatureFlags.useFiber) {
      Parent = class extends React.Component {
        static childContextTypes = {
          foo: React.PropTypes.string.isRequired,
          getFoo: React.PropTypes.func.isRequired,
        };

        getChildContext() {
          return {
            foo: this.props.bar,
            getFoo: () => this.props.bar,
          };
        }

        render() {
          return ReactDOM.unstable_createPortal(
            <Component />,
            portalContainer
          );
        }
      }
    } else {
      Parent = class extends React.Component {
        static childContextTypes = {
          foo: React.PropTypes.string.isRequired,
          getFoo: React.PropTypes.func.isRequired,
        };

        getChildContext() {
          return {
            foo: this.props.bar,
            getFoo: () => this.props.bar,
          };
        }

        render() {
          return null;
        }

        componentDidMount() {
          renderSubtreeIntoContainer(this, <Component />, portalContainer);
        }

        componentDidUpdate() {
          renderSubtreeIntoContainer(this, <Component />, portalContainer);
        }
      }      
    }

    ReactDOM.render(<Parent bar="initial" />, container);
    expect(portalContainer.firstChild.innerHTML).toBe('initial-initial');
    ReactDOM.render(<Parent bar="changed" />, container);
    expect(portalContainer.firstChild.innerHTML).toBe('changed-changed');
  });

});
