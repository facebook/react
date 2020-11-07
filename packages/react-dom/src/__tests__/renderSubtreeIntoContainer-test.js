/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const React = require('react');
const PropTypes = require('prop-types');
const ReactDOM = require('react-dom');
const ReactTestUtils = require('react-dom/test-utils');
const renderSubtreeIntoContainer = require('react-dom')
  .unstable_renderSubtreeIntoContainer;

const ReactFeatureFlags = require('shared/ReactFeatureFlags');

describe('renderSubtreeIntoContainer', () => {
  it('should pass context when rendering subtree elsewhere', () => {
    const portal = document.createElement('div');

    class Component extends React.Component {
      static contextTypes = {
        foo: PropTypes.string.isRequired,
      };

      render() {
        return <div>{this.context.foo}</div>;
      }
    }

    class Parent extends React.Component {
      static childContextTypes = {
        foo: PropTypes.string.isRequired,
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
        if (ReactFeatureFlags.warnUnstableRenderSubtreeIntoContainer) {
          expect(
            function() {
              renderSubtreeIntoContainer(this, <Component />, portal);
            }.bind(this),
          ).toWarnDev(
            'ReactDOM.unstable_renderSubtreeIntoContainer() is deprecated and ' +
              'will be removed in a future major release. Consider using React Portals instead.',
          );
        } else {
          renderSubtreeIntoContainer(this, <Component />, portal);
        }
      }
    }

    ReactTestUtils.renderIntoDocument(<Parent />);
    expect(portal.firstChild.innerHTML).toBe('bar');
  });

  it('should throw if parentComponent is invalid', () => {
    const portal = document.createElement('div');

    class Component extends React.Component {
      static contextTypes = {
        foo: PropTypes.string.isRequired,
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
        foo: PropTypes.string.isRequired,
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
          renderSubtreeIntoContainer(<Parent />, <Component />, portal);
        }).toThrowError('parentComponentmust be a valid React Component');
      }
    }
  });

  it('should update context if it changes due to setState', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const portal = document.createElement('div');

    class Component extends React.Component {
      static contextTypes = {
        foo: PropTypes.string.isRequired,
        getFoo: PropTypes.func.isRequired,
      };

      render() {
        return <div>{this.context.foo + '-' + this.context.getFoo()}</div>;
      }
    }

    class Parent extends React.Component {
      static childContextTypes = {
        foo: PropTypes.string.isRequired,
        getFoo: PropTypes.func.isRequired,
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
        renderSubtreeIntoContainer(this, <Component />, portal);
      }

      componentDidUpdate() {
        renderSubtreeIntoContainer(this, <Component />, portal);
      }
    }

    const instance = ReactDOM.render(<Parent />, container);
    expect(portal.firstChild.innerHTML).toBe('initial-initial');
    instance.setState({bar: 'changed'});
    expect(portal.firstChild.innerHTML).toBe('changed-changed');
  });

  it('should update context if it changes due to re-render', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const portal = document.createElement('div');

    class Component extends React.Component {
      static contextTypes = {
        foo: PropTypes.string.isRequired,
        getFoo: PropTypes.func.isRequired,
      };

      render() {
        return <div>{this.context.foo + '-' + this.context.getFoo()}</div>;
      }
    }

    class Parent extends React.Component {
      static childContextTypes = {
        foo: PropTypes.string.isRequired,
        getFoo: PropTypes.func.isRequired,
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
        renderSubtreeIntoContainer(this, <Component />, portal);
      }

      componentDidUpdate() {
        renderSubtreeIntoContainer(this, <Component />, portal);
      }
    }

    ReactDOM.render(<Parent bar="initial" />, container);
    expect(portal.firstChild.innerHTML).toBe('initial-initial');
    ReactDOM.render(<Parent bar="changed" />, container);
    expect(portal.firstChild.innerHTML).toBe('changed-changed');
  });

  it('should render portal with non-context-provider parent', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const portal = document.createElement('div');

    class Parent extends React.Component {
      render() {
        return null;
      }

      componentDidMount() {
        renderSubtreeIntoContainer(this, <div>hello</div>, portal);
      }
    }

    ReactDOM.render(<Parent bar="initial" />, container);
    expect(portal.firstChild.innerHTML).toBe('hello');
  });

  it('should get context through non-context-provider parent', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const portal = document.createElement('div');

    class Parent extends React.Component {
      render() {
        return <Middle />;
      }
      getChildContext() {
        return {value: this.props.value};
      }
      static childContextTypes = {
        value: PropTypes.string.isRequired,
      };
    }

    class Middle extends React.Component {
      render() {
        return null;
      }
      componentDidMount() {
        renderSubtreeIntoContainer(this, <Child />, portal);
      }
    }

    class Child extends React.Component {
      static contextTypes = {
        value: PropTypes.string.isRequired,
      };
      render() {
        return <div>{this.context.value}</div>;
      }
    }

    ReactDOM.render(<Parent value="foo" />, container);
    expect(portal.textContent).toBe('foo');
  });

  it('should get context through middle non-context-provider layer', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const portal1 = document.createElement('div');
    const portal2 = document.createElement('div');

    class Parent extends React.Component {
      render() {
        return null;
      }
      getChildContext() {
        return {value: this.props.value};
      }
      componentDidMount() {
        renderSubtreeIntoContainer(this, <Middle />, portal1);
      }
      static childContextTypes = {
        value: PropTypes.string.isRequired,
      };
    }

    class Middle extends React.Component {
      render() {
        return null;
      }
      componentDidMount() {
        renderSubtreeIntoContainer(this, <Child />, portal2);
      }
    }

    class Child extends React.Component {
      static contextTypes = {
        value: PropTypes.string.isRequired,
      };
      render() {
        return <div>{this.context.value}</div>;
      }
    }

    ReactDOM.render(<Parent value="foo" />, container);
    expect(portal2.textContent).toBe('foo');
  });

  it('fails gracefully when mixing React 15 and 16', () => {
    class C extends React.Component {
      render() {
        return <div />;
      }
    }
    const c = ReactDOM.render(<C />, document.createElement('div'));
    // React 15 calls this:
    // https://github.com/facebook/react/blob/77b71fc3c4/src/renderers/dom/client/ReactMount.js#L478-L479
    expect(() => {
      c._reactInternalInstance._processChildContext({});
    }).toThrow(
      __DEV__
        ? '_processChildContext is not available in React 16+. This likely ' +
            'means you have multiple copies of React and are attempting to nest ' +
            'a React 15 tree inside a React 16 tree using ' +
            "unstable_renderSubtreeIntoContainer, which isn't supported. Try to " +
            'make sure you have only one copy of React (and ideally, switch to ' +
            'ReactDOM.createPortal).'
        : "Cannot read property '_processChildContext' of undefined",
    );
  });
});
