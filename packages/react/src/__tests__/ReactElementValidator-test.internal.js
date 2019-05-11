/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

// NOTE: We're explicitly not using JSX in this file. This is intended to test
// classic JS without JSX.

let PropTypes;
let ReactFeatureFlags;
let React;
let ReactDOM;
let ReactTestUtils;

describe('ReactElementValidator', () => {
  let ComponentClass;

  beforeEach(() => {
    jest.resetModules();

    PropTypes = require('prop-types');
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback = false;
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
    ComponentClass = class extends React.Component {
      render() {
        return React.createElement('div');
      }
    };
  });

  it('warns for keys for arrays of elements in rest args', () => {
    const Component = React.createFactory(ComponentClass);

    expect(() => {
      Component(null, [Component(), Component()]);
    }).toWarnDev('Each child in a list should have a unique "key" prop.');
  });

  it('warns for keys for arrays of elements with owner info', () => {
    const Component = React.createFactory(ComponentClass);

    class InnerClass extends React.Component {
      render() {
        return Component(null, this.props.childSet);
      }
    }

    const InnerComponent = React.createFactory(InnerClass);

    class ComponentWrapper extends React.Component {
      render() {
        return InnerComponent({childSet: [Component(), Component()]});
      }
    }

    expect(() => {
      ReactTestUtils.renderIntoDocument(React.createElement(ComponentWrapper));
    }).toWarnDev(
      'Each child in a list should have a unique "key" prop.' +
        '\n\nCheck the render method of `InnerClass`. ' +
        'It was passed a child from ComponentWrapper. ',
    );
  });

  it('warns for keys for arrays with no owner or parent info', () => {
    function Anonymous() {
      return <div />;
    }
    Object.defineProperty(Anonymous, 'name', {value: undefined});

    const divs = [<div />, <div />];

    expect(() => {
      ReactTestUtils.renderIntoDocument(<Anonymous>{divs}</Anonymous>);
    }).toWarnDev(
      'Warning: Each child in a list should have a unique ' +
        '"key" prop. See https://fb.me/react-warning-keys for more information.\n' +
        '    in div (at **)',
    );
  });

  it('warns for keys for arrays of elements with no owner info', () => {
    const divs = [<div />, <div />];

    expect(() => {
      ReactTestUtils.renderIntoDocument(<div>{divs}</div>);
    }).toWarnDev(
      'Warning: Each child in a list should have a unique ' +
        '"key" prop.\n\nCheck the top-level render call using <div>. See ' +
        'https://fb.me/react-warning-keys for more information.\n' +
        '    in div (at **)',
    );
  });

  it('warns for keys with component stack info', () => {
    function Component() {
      return <div>{[<div />, <div />]}</div>;
    }

    function Parent(props) {
      return React.cloneElement(props.child);
    }

    function GrandParent() {
      return <Parent child={<Component />} />;
    }

    expect(() => ReactTestUtils.renderIntoDocument(<GrandParent />)).toWarnDev(
      'Warning: Each child in a list should have a unique ' +
        '"key" prop.\n\nCheck the render method of `Component`. See ' +
        'https://fb.me/react-warning-keys for more information.\n' +
        '    in div (at **)\n' +
        '    in Component (at **)\n' +
        '    in Parent (at **)\n' +
        '    in GrandParent (at **)',
    );
  });

  it('does not warn for keys when passing children down', () => {
    function Wrapper(props) {
      return (
        <div>
          {props.children}
          <footer />
        </div>
      );
    }

    ReactTestUtils.renderIntoDocument(
      <Wrapper>
        <span />
        <span />
      </Wrapper>,
    );
  });

  it('warns for keys for iterables of elements in rest args', () => {
    const Component = React.createFactory(ComponentClass);

    const iterable = {
      '@@iterator': function() {
        let i = 0;
        return {
          next: function() {
            const done = ++i > 2;
            return {value: done ? undefined : Component(), done: done};
          },
        };
      },
    };

    expect(() => Component(null, iterable)).toWarnDev(
      'Each child in a list should have a unique "key" prop.',
    );
  });

  it('does not warns for arrays of elements with keys', () => {
    const Component = React.createFactory(ComponentClass);

    Component(null, [Component({key: '#1'}), Component({key: '#2'})]);
  });

  it('does not warns for iterable elements with keys', () => {
    const Component = React.createFactory(ComponentClass);

    const iterable = {
      '@@iterator': function() {
        let i = 0;
        return {
          next: function() {
            const done = ++i > 2;
            return {
              value: done ? undefined : Component({key: '#' + i}),
              done: done,
            };
          },
        };
      },
    };

    Component(null, iterable);
  });

  it('does not warn when the element is directly in rest args', () => {
    const Component = React.createFactory(ComponentClass);

    Component(null, Component(), Component());
  });

  it('does not warn when the array contains a non-element', () => {
    const Component = React.createFactory(ComponentClass);

    Component(null, [{}, {}]);
  });

  it('should give context for PropType errors in nested components.', () => {
    // In this test, we're making sure that if a proptype error is found in a
    // component, we give a small hint as to which parent instantiated that
    // component as per warnings about key usage in ReactElementValidator.
    function MyComp(props) {
      return React.createElement('div', null, 'My color is ' + props.color);
    }
    MyComp.propTypes = {
      color: PropTypes.string,
    };
    function ParentComp() {
      return React.createElement(MyComp, {color: 123});
    }
    expect(() => {
      ReactTestUtils.renderIntoDocument(React.createElement(ParentComp));
    }).toWarnDev(
      'Warning: Failed prop type: ' +
        'Invalid prop `color` of type `number` supplied to `MyComp`, ' +
        'expected `string`.\n' +
        '    in MyComp (created by ParentComp)\n' +
        '    in ParentComp',
    );
  });

  it('gives a helpful error when passing invalid types', () => {
    function Foo() {}
    expect(() => {
      React.createElement(undefined);
      React.createElement(null);
      React.createElement(true);
      React.createElement({x: 17});
      React.createElement({});
      React.createElement(React.createElement('div'));
      React.createElement(React.createElement(Foo));
      React.createElement(React.createElement(React.createContext().Consumer));
      React.createElement({$$typeof: 'non-react-thing'});
    }).toWarnDev(
      [
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: undefined. You likely forgot to export your ' +
          "component from the file it's defined in, or you might have mixed up " +
          'default and named imports.',
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: null.',
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: boolean.',
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: object.',
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: object. You likely forgot to export your ' +
          "component from the file it's defined in, or you might have mixed up " +
          'default and named imports.',
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: <div />. Did you accidentally export a JSX literal ' +
          'instead of a component?',
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: <Foo />. Did you accidentally export a JSX literal ' +
          'instead of a component?',
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: <Context.Consumer />. Did you accidentally ' +
          'export a JSX literal instead of a component?',
        'Warning: React.createElement: type is invalid -- expected a string ' +
          '(for built-in components) or a class/function (for composite ' +
          'components) but got: object.',
      ],
      {withoutStack: true},
    );

    // Should not log any additional warnings
    React.createElement('div');
  });

  it('includes the owner name when passing null, undefined, boolean, or number', () => {
    function ParentComp() {
      return React.createElement(null);
    }

    expect(() => {
      expect(() => {
        ReactTestUtils.renderIntoDocument(React.createElement(ParentComp));
      }).toThrowError(
        'Element type is invalid: expected a string (for built-in components) ' +
          'or a class/function (for composite components) but got: null.' +
          (__DEV__ ? '\n\nCheck the render method of `ParentComp`.' : ''),
      );
    }).toWarnDev(
      'Warning: React.createElement: type is invalid -- expected a string ' +
        '(for built-in components) or a class/function (for composite ' +
        'components) but got: null.' +
        '\n\nCheck the render method of `ParentComp`.\n    in ParentComp',
    );
  });

  it('should check default prop values', () => {
    class Component extends React.Component {
      static propTypes = {prop: PropTypes.string.isRequired};
      static defaultProps = {prop: null};
      render() {
        return React.createElement('span', null, this.props.prop);
      }
    }

    expect(() =>
      ReactTestUtils.renderIntoDocument(React.createElement(Component)),
    ).toWarnDev(
      'Warning: Failed prop type: The prop `prop` is marked as required in ' +
        '`Component`, but its value is `null`.\n' +
        '    in Component',
    );
  });

  it('should not check the default for explicit null', () => {
    class Component extends React.Component {
      static propTypes = {prop: PropTypes.string.isRequired};
      static defaultProps = {prop: 'text'};
      render() {
        return React.createElement('span', null, this.props.prop);
      }
    }

    expect(() => {
      ReactTestUtils.renderIntoDocument(
        React.createElement(Component, {prop: null}),
      );
    }).toWarnDev(
      'Warning: Failed prop type: The prop `prop` is marked as required in ' +
        '`Component`, but its value is `null`.\n' +
        '    in Component',
    );
  });

  it('should check declared prop types', () => {
    class Component extends React.Component {
      static propTypes = {
        prop: PropTypes.string.isRequired,
      };
      render() {
        return React.createElement('span', null, this.props.prop);
      }
    }

    expect(() => {
      ReactTestUtils.renderIntoDocument(React.createElement(Component));
      ReactTestUtils.renderIntoDocument(
        React.createElement(Component, {prop: 42}),
      );
    }).toWarnDev([
      'Warning: Failed prop type: ' +
        'The prop `prop` is marked as required in `Component`, but its value ' +
        'is `undefined`.\n' +
        '    in Component',
      'Warning: Failed prop type: ' +
        'Invalid prop `prop` of type `number` supplied to ' +
        '`Component`, expected `string`.\n' +
        '    in Component',
    ]);

    // Should not error for strings
    ReactTestUtils.renderIntoDocument(
      React.createElement(Component, {prop: 'string'}),
    );
  });

  it('should warn if a PropType creator is used as a PropType', () => {
    class Component extends React.Component {
      static propTypes = {
        myProp: PropTypes.shape,
      };
      render() {
        return React.createElement('span', null, this.props.myProp.value);
      }
    }

    expect(() => {
      ReactTestUtils.renderIntoDocument(
        React.createElement(Component, {myProp: {value: 'hi'}}),
      );
    }).toWarnDev(
      'Warning: Component: type specification of prop `myProp` is invalid; ' +
        'the type checker function must return `null` or an `Error` but ' +
        'returned a function. You may have forgotten to pass an argument to ' +
        'the type checker creator (arrayOf, instanceOf, objectOf, oneOf, ' +
        'oneOfType, and shape all require an argument).',
      {withoutStack: true},
    );
  });

  it('should warn if component declares PropTypes instead of propTypes', () => {
    class MisspelledPropTypesComponent extends React.Component {
      static PropTypes = {
        prop: PropTypes.string,
      };
      render() {
        return React.createElement('span', null, this.props.prop);
      }
    }

    expect(() => {
      ReactTestUtils.renderIntoDocument(
        React.createElement(MisspelledPropTypesComponent, {prop: 'Hi'}),
      );
    }).toWarnDev(
      'Warning: Component MisspelledPropTypesComponent declared `PropTypes` ' +
        'instead of `propTypes`. Did you misspell the property assignment?',
      {withoutStack: true},
    );
  });

  it('warns for fragments with illegal attributes', () => {
    class Foo extends React.Component {
      render() {
        return React.createElement(React.Fragment, {a: 1}, '123');
      }
    }

    expect(() => {
      ReactTestUtils.renderIntoDocument(React.createElement(Foo));
    }).toWarnDev(
      'Invalid prop `a` supplied to `React.Fragment`. React.Fragment ' +
        'can only have `key` and `children` props.',
    );
  });

  it('should warn when accessing .type on an element factory', () => {
    function TestComponent() {
      return <div />;
    }

    let TestFactory = React.createFactory(TestComponent);
    expect(() => TestFactory.type).toLowPriorityWarnDev(
      'Warning: Factory.type is deprecated. Access the class directly before ' +
        'passing it to createFactory.',
      {withoutStack: true},
    );

    // Warn once, not again
    expect(TestFactory.type).toBe(TestComponent);
  });

  it('does not warn when using DOM node as children', () => {
    class DOMContainer extends React.Component {
      render() {
        return <div />;
      }
      componentDidMount() {
        ReactDOM.findDOMNode(this).appendChild(this.props.children);
      }
    }

    const node = document.createElement('div');
    // This shouldn't cause a stack overflow or any other problems (#3883)
    ReactTestUtils.renderIntoDocument(<DOMContainer>{node}</DOMContainer>);
  });

  it('should not enumerate enumerable numbers (#4776)', () => {
    /*eslint-disable no-extend-native */
    Number.prototype['@@iterator'] = function() {
      throw new Error('number iterator called');
    };
    /*eslint-enable no-extend-native */

    try {
      void (
        <div>
          {5}
          {12}
          {13}
        </div>
      );
    } finally {
      delete Number.prototype['@@iterator'];
    }
  });

  it('does not blow up with inlined children', () => {
    // We don't suggest this since it silences all sorts of warnings, but we
    // shouldn't blow up either.

    const child = {
      $$typeof: <div />.$$typeof,
      type: 'span',
      key: null,
      ref: null,
      props: {},
      _owner: null,
    };

    void <div>{[child]}</div>;
  });

  it('does not blow up on key warning with undefined type', () => {
    const Foo = undefined;
    expect(() => {
      void <Foo>{[<div />]}</Foo>;
    }).toWarnDev(
      'Warning: React.createElement: type is invalid -- expected a string ' +
        '(for built-in components) or a class/function (for composite ' +
        'components) but got: undefined. You likely forgot to export your ' +
        "component from the file it's defined in, or you might have mixed up " +
        'default and named imports.\n\nCheck your code at **.',
      {withoutStack: true},
    );
  });
});
