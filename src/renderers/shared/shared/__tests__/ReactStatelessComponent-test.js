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
var ReactTestUtils;

var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');

function StatelessComponent(props) {
  return <div>{props.name}</div>;
}

describe('ReactStatelessComponent', () => {
  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  beforeEach(() => {
    jest.resetModuleRegistry();
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactTestUtils = require('ReactTestUtils');
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
        test: React.PropTypes.string.isRequired,
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
        test: React.PropTypes.string.isRequired,
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
      foo: React.PropTypes.string,
    };

    var container = document.createElement('div');

    ReactDOM.render(<StatelessComponentWithChildContext name="A" />, container);

    expectDev(console.error.calls.count()).toBe(2);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'StatelessComponentWithChildContext(...): childContextTypes cannot ' +
      'be defined on a functional component.'
    );
    expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(1)[0])).toBe(
      'Warning: StatelessComponentWithChildContext.childContextTypes is specified ' +
      'but there is no getChildContext() method on the instance. You can either ' +
      'define getChildContext() on StatelessComponentWithChildContext or remove ' +
      'childContextTypes from it.'
    );
  });

  if (!ReactDOMFeatureFlags.useFiber) {
    // Stack doesn't support fragments
    it('should throw when stateless component returns array', () => {
      function NotAComponent() {
        return [<div />, <div />];
      }
      expect(function() {
        ReactTestUtils.renderIntoDocument(<div><NotAComponent /></div>);
      }).toThrowError(
        'NotAComponent(...): A valid React element (or null) must be returned. ' +
        'You may have returned undefined, an array or some other invalid object.'
      );
    });
  }

  it('should throw when stateless component returns undefined', () => {
    function NotAComponent() {
    }
    expect(function() {
      ReactTestUtils.renderIntoDocument(<div><NotAComponent /></div>);
    }).toThrowError(
      ReactDOMFeatureFlags.useFiber ?
        // Fiber gives a more specific error message for undefined because it
        // supports more return types.
        'NotAComponent(...): Nothing was returned from render' :
        // Stack's message is generic.
        'NotAComponent(...): A valid React element (or null) must be returned. ' +
        'You may have returned undefined, an array or some other invalid object.'
    );
  });

  it('should throw on string refs in pure functions', () => {
    function Child() {
      return <div ref="me" />;
    }

    expect(function() {
      ReactTestUtils.renderIntoDocument(<Child test="test" />);
    }).toThrowError(
      'Stateless function components cannot have refs.'
    );
  });

  it('should warn when given a string ref', () => {
    spyOn(console, 'error');

    function Indirection(props) {
      return <div>{props.children}</div>;
    }

    class ParentUsingStringRef extends React.Component {
      render() {
        return (
          <Indirection>
            <StatelessComponent name="A" ref="stateless" />
          </Indirection>
        );
      }
    }

    ReactTestUtils.renderIntoDocument(<ParentUsingStringRef />);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
      'Warning: Stateless function components cannot be given refs. ' +
      'Attempts to access this ref will fail. Check the render method ' +
      'of `ParentUsingStringRef`.\n' +
      '    in StatelessComponent (at **)\n' +
      '    in div (at **)\n' +
      '    in Indirection (at **)\n' +
      '    in ParentUsingStringRef (at **)'
    );

    ReactTestUtils.renderIntoDocument(<ParentUsingStringRef />);
    expectDev(console.error.calls.count()).toBe(1);
  });

  it('should warn when given a function ref', () => {
    spyOn(console, 'error');

    function Indirection(props) {
      return <div>{props.children}</div>;
    }

    class ParentUsingFunctionRef extends React.Component {
      render() {
        return (
          <Indirection>
            <StatelessComponent name="A" ref={(arg) => {
              expect(arg).toBe(null);
            }} />
          </Indirection>
        );
      }
    }

    ReactTestUtils.renderIntoDocument(<ParentUsingFunctionRef />);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
      'Warning: Stateless function components cannot be given refs. ' +
      'Attempts to access this ref will fail. Check the render method ' +
      'of `ParentUsingFunctionRef`.\n' +
      '    in StatelessComponent (at **)\n' +
      '    in div (at **)\n' +
      '    in Indirection (at **)\n' +
      '    in ParentUsingFunctionRef (at **)'
    );

    ReactTestUtils.renderIntoDocument(<ParentUsingFunctionRef />);
    expectDev(console.error.calls.count()).toBe(1);
  });

  it('deduplicates ref warnings based on element or owner', () => {
    spyOn(console, 'error');

    // Prevent the Babel transform adding a displayName.
    var createClassWithoutDisplayName = React.createClass;

    // When owner uses JSX, we can use exact line location to dedupe warnings
    var AnonymousParentUsingJSX = createClassWithoutDisplayName({
      render() {
        return <StatelessComponent name="A" ref={() => {}} />;
      },
    });
    const instance1 = ReactTestUtils.renderIntoDocument(<AnonymousParentUsingJSX />);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Warning: Stateless function components cannot be given refs.'
    );
    // Should be deduped (offending element is on the same line):
    instance1.forceUpdate();
    // Should also be deduped (offending element is on the same line):
    ReactTestUtils.renderIntoDocument(<AnonymousParentUsingJSX />);
    expectDev(console.error.calls.count()).toBe(1);
    console.error.calls.reset();

    // When owner doesn't use JSX, and is anonymous, we warn once per internal instance.
    var AnonymousParentNotUsingJSX = createClassWithoutDisplayName({
      render() {
        return React.createElement(StatelessComponent, {name: 'A', 'ref': () => {}});
      },
    });
    const instance2 = ReactTestUtils.renderIntoDocument(<AnonymousParentNotUsingJSX />);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Warning: Stateless function components cannot be given refs.'
    );
    // Should be deduped (same internal instance):
    instance2.forceUpdate();
    expectDev(console.error.calls.count()).toBe(1);
    // Could not be deduped (different internal instance):
    ReactTestUtils.renderIntoDocument(<AnonymousParentNotUsingJSX />);
    expectDev(console.error.calls.count()).toBe(2);
    expectDev(console.error.calls.argsFor(1)[0]).toContain(
      'Warning: Stateless function components cannot be given refs.'
    );
    console.error.calls.reset();

    // When owner doesn't use JSX, but is named, we warn once per owner name
    class NamedParentNotUsingJSX extends React.Component {
      render() {
        return React.createElement(StatelessComponent, {name: 'A', 'ref': () => {}});
      }
    }
    const instance3 = ReactTestUtils.renderIntoDocument(<NamedParentNotUsingJSX />);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Warning: Stateless function components cannot be given refs.'
    );
    // Should be deduped (same owner name):
    instance3.forceUpdate();
    expectDev(console.error.calls.count()).toBe(1);
    // Should also be deduped (same owner name):
    ReactTestUtils.renderIntoDocument(<NamedParentNotUsingJSX />);
    expectDev(console.error.calls.count()).toBe(1);
    console.error.calls.reset();
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
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain('a unique "key" prop');
    expectDev(console.error.calls.argsFor(0)[0]).toContain('Child');
  });

  it('should support default props and prop types', () => {
    function Child(props) {
      return <div>{props.test}</div>;
    }
    Child.defaultProps = {test: 2};
    Child.propTypes = {test: React.PropTypes.string};

    spyOn(console, 'error');
    ReactTestUtils.renderIntoDocument(<Child />);
    expectDev(console.error.calls.count()).toBe(1);
    expect(
      console.error.calls.argsFor(0)[0].replace(/\(at .+?:\d+\)/g, '(at **)')
    ).toBe(
      'Warning: Failed prop type: Invalid prop `test` of type `number` ' +
      'supplied to `Child`, expected `string`.\n' +
      '    in Child (at **)'
    );
  });

  it('should receive context', () => {
    class Parent extends React.Component {
      static childContextTypes = {
        lang: React.PropTypes.string,
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
    Child.contextTypes = {lang: React.PropTypes.string};

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

});
