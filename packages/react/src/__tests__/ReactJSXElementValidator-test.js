/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

// TODO: All these warnings should become static errors using Flow instead
// of dynamic errors when using JSX with Flow.
let React;
let ReactTestUtils;

describe('ReactJSXElementValidator', () => {
  let Component;
  let RequiredPropComponent;

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactTestUtils = require('react-dom/test-utils');

    Component = class extends React.Component {
      render() {
        return <div />;
      }
    };

    RequiredPropComponent = class extends React.Component {
      render() {
        return <span>{this.props.prop}</span>;
      }
    };
    RequiredPropComponent.displayName = 'RequiredPropComponent';
  });

  it('warns for keys for arrays of elements in children position', () => {
    expect(() =>
      ReactTestUtils.renderIntoDocument(
        <Component>{[<Component />, <Component />]}</Component>,
      ),
    ).toErrorDev('Each child in a list should have a unique "key" prop.');
  });

  it('warns for keys for arrays of elements with owner info', () => {
    class InnerComponent extends React.Component {
      render() {
        return <Component>{this.props.childSet}</Component>;
      }
    }

    class ComponentWrapper extends React.Component {
      render() {
        return <InnerComponent childSet={[<Component />, <Component />]} />;
      }
    }

    expect(() =>
      ReactTestUtils.renderIntoDocument(<ComponentWrapper />),
    ).toErrorDev(
      'Each child in a list should have a unique "key" prop.' +
        '\n\nCheck the render method of `InnerComponent`. ' +
        'It was passed a child from ComponentWrapper. ',
    );
  });

  it('warns for keys for iterables of elements in rest args', () => {
    const iterable = {
      '@@iterator': function () {
        let i = 0;
        return {
          next: function () {
            const done = ++i > 2;
            return {value: done ? undefined : <Component />, done: done};
          },
        };
      },
    };

    expect(() =>
      ReactTestUtils.renderIntoDocument(<Component>{iterable}</Component>),
    ).toErrorDev('Each child in a list should have a unique "key" prop.');
  });

  it('does not warn for arrays of elements with keys', () => {
    ReactTestUtils.renderIntoDocument(
      <Component>{[<Component key="#1" />, <Component key="#2" />]}</Component>,
    );
  });

  it('does not warn for iterable elements with keys', () => {
    const iterable = {
      '@@iterator': function () {
        let i = 0;
        return {
          next: function () {
            const done = ++i > 2;
            return {
              value: done ? undefined : <Component key={'#' + i} />,
              done: done,
            };
          },
        };
      },
    };

    ReactTestUtils.renderIntoDocument(<Component>{iterable}</Component>);
  });

  it('does not warn for numeric keys in entry iterable as a child', () => {
    const iterable = {
      '@@iterator': function () {
        let i = 0;
        return {
          next: function () {
            const done = ++i > 2;
            return {value: done ? undefined : [i, <Component />], done: done};
          },
        };
      },
    };
    iterable.entries = iterable['@@iterator'];

    ReactTestUtils.renderIntoDocument(<Component>{iterable}</Component>);
  });

  it('does not warn when the element is directly as children', () => {
    ReactTestUtils.renderIntoDocument(
      <Component>
        <Component />
        <Component />
      </Component>,
    );
  });

  it('does not warn when the child array contains non-elements', () => {
    void (<Component>{[{}, {}]}</Component>);
  });

  it('should give context for errors in nested components.', () => {
    class MyComp extends React.Component {
      render() {
        return [<div />];
      }
    }
    class ParentComp extends React.Component {
      render() {
        return <MyComp />;
      }
    }
    expect(() => ReactTestUtils.renderIntoDocument(<ParentComp />)).toErrorDev(
      'Each child in a list should have a unique "key" prop. ' +
        'See https://reactjs.org/link/warning-keys for more information.\n' +
        '    in MyComp (at **)\n' +
        '    in ParentComp (at **)',
    );
  });

  it('gives a helpful error when passing null, undefined, or boolean', () => {
    const Undefined = undefined;
    const Null = null;
    const True = true;
    const Div = 'div';
    expect(() => void (<Undefined />)).toErrorDev(
      'Warning: React.jsx: type is invalid -- expected a string ' +
        '(for built-in components) or a class/function (for composite ' +
        'components) but got: undefined. You likely forgot to export your ' +
        "component from the file it's defined in, or you might have mixed up " +
        'default and named imports.' +
        '\n\nCheck your code at **.',
      {withoutStack: true},
    );
    expect(() => void (<Null />)).toErrorDev(
      'Warning: React.jsx: type is invalid -- expected a string ' +
        '(for built-in components) or a class/function (for composite ' +
        'components) but got: null.' +
        '\n\nCheck your code at **.',
      {withoutStack: true},
    );
    expect(() => void (<True />)).toErrorDev(
      'Warning: React.jsx: type is invalid -- expected a string ' +
        '(for built-in components) or a class/function (for composite ' +
        'components) but got: boolean.' +
        '\n\nCheck your code at **.',
      {withoutStack: true},
    );
    // No error expected
    void (<Div />);
  });

  it('warns for fragments with illegal attributes', () => {
    class Foo extends React.Component {
      render() {
        return <React.Fragment a={1}>hello</React.Fragment>;
      }
    }

    expect(() => ReactTestUtils.renderIntoDocument(<Foo />)).toErrorDev(
      'Invalid prop `a` supplied to `React.Fragment`. React.Fragment ' +
        'can only have `key` and `children` props.',
    );
  });

  it('warns for fragments with refs', () => {
    class Foo extends React.Component {
      render() {
        return (
          <React.Fragment
            ref={bar => {
              this.foo = bar;
            }}>
            hello
          </React.Fragment>
        );
      }
    }

    if (gate(flags => flags.enableRefAsProp)) {
      expect(() => ReactTestUtils.renderIntoDocument(<Foo />)).toErrorDev(
        'Invalid prop `ref` supplied to `React.Fragment`.',
      );
    } else {
      expect(() => ReactTestUtils.renderIntoDocument(<Foo />)).toErrorDev(
        'Invalid attribute `ref` supplied to `React.Fragment`.',
      );
    }
  });

  it('does not warn for fragments of multiple elements without keys', () => {
    ReactTestUtils.renderIntoDocument(
      <>
        <span>1</span>
        <span>2</span>
      </>,
    );
  });

  it('warns for fragments of multiple elements with same key', () => {
    expect(() =>
      ReactTestUtils.renderIntoDocument(
        <>
          <span key="a">1</span>
          <span key="a">2</span>
          <span key="b">3</span>
        </>,
      ),
    ).toErrorDev('Encountered two children with the same key, `a`.', {
      withoutStack: true,
    });
  });

  it('does not call lazy initializers eagerly', () => {
    let didCall = false;
    const Lazy = React.lazy(() => {
      didCall = true;
      return {then() {}};
    });
    <Lazy />;
    expect(didCall).toBe(false);
  });
});
