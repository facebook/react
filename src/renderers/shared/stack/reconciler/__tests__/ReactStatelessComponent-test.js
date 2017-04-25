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

var PropTypes;
var React;
var ReactDOM;
var ReactTestUtils;

function StatelessComponent(props) {
  return <div>{props.name}</div>;
}

describe('ReactStatelessComponent', () => {
  beforeEach(() => {
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactTestUtils = require('ReactTestUtils');
    PropTypes = require('prop-types');
  });

  it('should render stateless component', () => {
    var el = document.createElement('div');
    ReactDOM.render(<StatelessComponent name="A" />, el);

    expect(el.textContent).toBe('A');
  });

  it('should update stateless component', () => {
    class Parent extends React.Component {
      render() {
        return <StatelessComponent {...this.props} />;
      }
    }

    var el = document.createElement('div');
    ReactDOM.render(<Parent name="A" />, el);
    expect(el.textContent).toBe('A');

    ReactDOM.render(<Parent name="B" />, el);
    expect(el.textContent).toBe('B');
  });

  it('should unmount stateless component', () => {
    var container = document.createElement('div');

    ReactDOM.render(<StatelessComponent name="A" />, container);
    expect(container.textContent).toBe('A');

    ReactDOM.unmountComponentAtNode(container);
    expect(container.textContent).toBe('');
  });

  it('should pass context thru stateless component', () => {
    class Child extends React.Component {
      static contextTypes = {
        test: PropTypes.string.isRequired,
      };

      render() {
        return <div>{this.context.test}</div>;
      }
    }

    function Parent() {
      return <Child />;
    }

    class GrandParent extends React.Component {
      static childContextTypes = {
        test: PropTypes.string.isRequired,
      };

      getChildContext() {
        return {test: this.props.test};
      }

      render() {
        return <Parent />;
      }
    }

    var el = document.createElement('div');
    ReactDOM.render(<GrandParent test="test" />, el);

    expect(el.textContent).toBe('test');

    ReactDOM.render(<GrandParent test="mest" />, el);

    expect(el.textContent).toBe('mest');
  });

  it('should warn for childContextTypes on a functional component', () => {
    spyOn(console, 'error');
    function StatelessComponentWithChildContext(props) {
      return <div>{props.name}</div>;
    }

    StatelessComponentWithChildContext.childContextTypes = {
      foo: PropTypes.string,
    };

    var container = document.createElement('div');

    ReactDOM.render(<StatelessComponentWithChildContext name="A" />, container);

    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'StatelessComponentWithChildContext(...): childContextTypes cannot ' +
        'be defined on a functional component.',
    );
  });

  it('should warn when stateless component returns array', () => {
    spyOn(console, 'error');
    function NotAComponent() {
      return [<div />, <div />];
    }
    expect(function() {
      ReactTestUtils.renderIntoDocument(<div><NotAComponent /></div>);
    }).toThrow();
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'NotAComponent(...): A valid React element (or null) must be returned. ' +
        'You may have returned undefined, an array or some other invalid object.',
    );
  });

  it('should throw on string refs in pure functions', () => {
    function Child() {
      return <div ref="me" />;
    }

    expect(function() {
      ReactTestUtils.renderIntoDocument(<Child test="test" />);
    }).toThrowError('Stateless function components cannot have refs.');
  });

  it('should warn when given a ref', () => {
    spyOn(console, 'error');

    class Parent extends React.Component {
      static displayName = 'Parent';

      render() {
        return <StatelessComponent name="A" ref="stateless" />;
      }
    }

    ReactTestUtils.renderIntoDocument(<Parent />);

    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'Stateless function components cannot be given refs ' +
        '(See ref "stateless" in StatelessComponent created by Parent). ' +
        'Attempts to access this ref will fail.',
    );
  });

  it('should provide a null ref', () => {
    function Child() {
      return <div />;
    }

    var comp = ReactTestUtils.renderIntoDocument(<Child />);
    expect(comp).toBe(null);
  });

  it('should use correct name in key warning', () => {
    function Child() {
      return <div>{[<span />]}</div>;
    }

    spyOn(console, 'error');
    ReactTestUtils.renderIntoDocument(<Child />);
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain('a unique "key" prop');
    expect(console.error.calls.argsFor(0)[0]).toContain('Child');
  });

  it('should support default props and prop types', () => {
    function Child(props) {
      return <div>{props.test}</div>;
    }
    Child.defaultProps = {test: 2};
    Child.propTypes = {test: PropTypes.string};

    spyOn(console, 'error');
    ReactTestUtils.renderIntoDocument(<Child />);
    expect(console.error.calls.count()).toBe(1);
    expect(
      console.error.calls.argsFor(0)[0].replace(/\(at .+?:\d+\)/g, '(at **)'),
    ).toBe(
      'Warning: Failed prop type: Invalid prop `test` of type `number` ' +
        'supplied to `Child`, expected `string`.\n' +
        '    in Child (at **)',
    );
  });

  it('should receive context', () => {
    class Parent extends React.Component {
      static childContextTypes = {
        lang: PropTypes.string,
      };

      getChildContext() {
        return {lang: 'en'};
      }

      render() {
        return <Child />;
      }
    }

    function Child(props, context) {
      return <div>{context.lang}</div>;
    }
    Child.contextTypes = {lang: PropTypes.string};

    var el = document.createElement('div');
    ReactDOM.render(<Parent />, el);
    expect(el.textContent).toBe('en');
  });

  it('should work with arrow functions', () => {
    var Child = function() {
      return <div />;
    };
    // Will create a new bound function without a prototype, much like a native
    // arrow function.
    Child = Child.bind(this);

    expect(() => ReactTestUtils.renderIntoDocument(<Child />)).not.toThrow();
  });

  it('should allow simple functions to return null', () => {
    var Child = function() {
      return null;
    };
    expect(() => ReactTestUtils.renderIntoDocument(<Child />)).not.toThrow();
  });

  it('should allow simple functions to return false', () => {
    function Child() {
      return false;
    }
    expect(() => ReactTestUtils.renderIntoDocument(<Child />)).not.toThrow();
  });

  it('should warn when using non-React functions in JSX', () => {
    spyOn(console, 'error');
    function NotAComponent() {
      return [<div />, <div />];
    }
    expect(function() {
      ReactTestUtils.renderIntoDocument(<div><NotAComponent /></div>);
    }).toThrow(); // has no method 'render'
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.argsFor(0)[0]).toContain(
      'NotAComponent(...): A valid React element (or null) must be returned. You may ' +
        'have returned undefined, an array or some other invalid object.',
    );
  });
});
