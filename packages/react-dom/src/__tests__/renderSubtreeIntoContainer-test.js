/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
const ReactDOMClient = require('react-dom/client');
const ReactTestUtils = require('react-dom/test-utils');
const act = require('internal-test-utils').act;
const renderSubtreeIntoContainer =
  require('react-dom').unstable_renderSubtreeIntoContainer;

describe('renderSubtreeIntoContainer', () => {
  // @gate !disableLegacyContext
  // @gate !disableLegacyMode
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
        expect(
          function () {
            renderSubtreeIntoContainer(this, <Component />, portal);
          }.bind(this),
        ).toErrorDev(
          'ReactDOM.unstable_renderSubtreeIntoContainer() is no longer supported',
        );
      }
    }

    ReactTestUtils.renderIntoDocument(<Parent />);
    expect(portal.firstChild.innerHTML).toBe('bar');
  });

  // @gate !disableLegacyContext
  // @gate !disableLegacyMode
  it('should update context if it changes due to setState', async () => {
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
        expect(() => {
          renderSubtreeIntoContainer(this, <Component />, portal);
        }).toErrorDev(
          'ReactDOM.unstable_renderSubtreeIntoContainer() is no longer supported',
        );
      }

      componentDidUpdate() {
        expect(() => {
          renderSubtreeIntoContainer(this, <Component />, portal);
        }).toErrorDev(
          'ReactDOM.unstable_renderSubtreeIntoContainer() is no longer supported',
        );
      }
    }
    const root = ReactDOMClient.createRoot(container);
    const parentRef = React.createRef();
    await act(async () => {
      root.render(<Parent ref={parentRef} />);
    });
    const instance = parentRef.current;

    expect(portal.firstChild.innerHTML).toBe('initial-initial');
    await act(async () => {
      instance.setState({bar: 'changed'});
    });
    expect(portal.firstChild.innerHTML).toBe('changed-changed');
  });

  // @gate !disableLegacyContext
  // @gate !disableLegacyMode
  it('should update context if it changes due to re-render', async () => {
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
        expect(() => {
          renderSubtreeIntoContainer(this, <Component />, portal);
        }).toErrorDev(
          'ReactDOM.unstable_renderSubtreeIntoContainer() is no longer supported',
        );
      }

      componentDidUpdate() {
        expect(() => {
          renderSubtreeIntoContainer(this, <Component />, portal);
        }).toErrorDev(
          'ReactDOM.unstable_renderSubtreeIntoContainer() is no longer supported',
        );
      }
    }

    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(<Parent bar="initial" />);
    });
    expect(portal.firstChild.innerHTML).toBe('initial-initial');
    await act(async () => {
      root.render(<Parent bar="changed" />);
    });
    expect(portal.firstChild.innerHTML).toBe('changed-changed');
  });

  // @gate !disableLegacyMode
  it('should render portal with non-context-provider parent', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const portal = document.createElement('div');

    class Parent extends React.Component {
      render() {
        return null;
      }

      componentDidMount() {
        expect(() => {
          renderSubtreeIntoContainer(this, <div>hello</div>, portal);
        }).toErrorDev(
          'ReactDOM.unstable_renderSubtreeIntoContainer() is no longer supported',
        );
      }
    }

    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(<Parent bar="initial" />);
    });
    expect(portal.firstChild.innerHTML).toBe('hello');
  });

  // @gate !disableLegacyContext
  // @gate !disableLegacyMode
  it('should get context through non-context-provider parent', async () => {
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
        expect(() => {
          renderSubtreeIntoContainer(this, <Child />, portal);
        }).toErrorDev(
          'ReactDOM.unstable_renderSubtreeIntoContainer() is no longer supported',
        );
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

    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(<Parent value="foo" />);
    });
    expect(portal.textContent).toBe('foo');
  });

  // @gate !disableLegacyContext
  // @gate !disableLegacyMode
  it('should get context through middle non-context-provider layer', async () => {
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
        expect(() => {
          renderSubtreeIntoContainer(this, <Middle />, portal1);
        }).toErrorDev(
          'ReactDOM.unstable_renderSubtreeIntoContainer() is no longer supported',
        );
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
        expect(() => {
          renderSubtreeIntoContainer(this, <Child />, portal2);
        }).toErrorDev(
          'ReactDOM.unstable_renderSubtreeIntoContainer() is no longer supported',
        );
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

    const root = ReactDOMClient.createRoot(container);
    await act(async () => {
      root.render(<Parent value="foo" />);
    });
    expect(portal2.textContent).toBe('foo');
  });

  // @gate !disableLegacyMode
  it('legacy test: fails gracefully when mixing React 15 and 16', () => {
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
