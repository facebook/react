/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
let ReactDOM;
let ReactTestUtils;
let PropTypes;

describe('ReactJSXElementValidator', () => {
  let Component;
  let RequiredPropComponent;

  beforeEach(() => {
    jest.resetModules();

    PropTypes = require('prop-types');
    React = require('react');
    ReactDOM = require('react-dom');
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
    RequiredPropComponent.propTypes = {prop: PropTypes.string.isRequired};
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
      '@@iterator': function() {
        let i = 0;
        return {
          next: function() {
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
      '@@iterator': function() {
        let i = 0;
        return {
          next: function() {
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
      '@@iterator': function() {
        let i = 0;
        return {
          next: function() {
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

  it('should give context for PropType errors in nested components.', () => {
    // In this test, we're making sure that if a proptype error is found in a
    // component, we give a small hint as to which parent instantiated that
    // component as per warnings about key usage in ReactElementValidator.
    class MyComp extends React.Component {
      render() {
        return <div>My color is {this.color}</div>;
      }
    }
    MyComp.propTypes = {
      color: PropTypes.string,
    };
    class ParentComp extends React.Component {
      render() {
        return <MyComp color={123} />;
      }
    }
    expect(() => ReactTestUtils.renderIntoDocument(<ParentComp />)).toErrorDev(
      'Warning: Failed prop type: ' +
        'Invalid prop `color` of type `number` supplied to `MyComp`, ' +
        'expected `string`.\n' +
        '    in MyComp (at **)\n' +
        '    in ParentComp (at **)',
    );
  });

  it('should update component stack after receiving next element', () => {
    function MyComp() {
      return null;
    }
    MyComp.propTypes = {
      color: PropTypes.string,
    };
    function MiddleComp(props) {
      return <MyComp color={props.color} />;
    }
    function ParentComp(props) {
      if (props.warn) {
        // This element has a source thanks to JSX.
        return <MiddleComp color={42} />;
      }
      // This element has no source.
      return React.createElement(MiddleComp, {color: 'blue'});
    }

    const container = document.createElement('div');
    ReactDOM.render(<ParentComp warn={false} />, container);
    expect(() =>
      ReactDOM.render(<ParentComp warn={true} />, container),
    ).toErrorDev(
      'Warning: Failed prop type: ' +
        'Invalid prop `color` of type `number` supplied to `MyComp`, ' +
        'expected `string`.\n' +
        '    in MyComp (at **)\n' +
        '    in MiddleComp (at **)\n' +
        '    in ParentComp (at **)',
    );
  });

  it('gives a helpful error when passing null, undefined, or boolean', () => {
    const Undefined = undefined;
    const Null = null;
    const True = true;
    const Div = 'div';
    expect(
      () => void (<Undefined />),
    ).toErrorDev(
      'Warning: React.createElement: type is invalid -- expected a string ' +
        '(for built-in components) or a class/function (for composite ' +
        'components) but got: undefined. You likely forgot to export your ' +
        "component from the file it's defined in, or you might have mixed up " +
        'default and named imports.' +
        '\n\nCheck your code at **.',
      {withoutStack: true},
    );
    expect(
      () => void (<Null />),
    ).toErrorDev(
      'Warning: React.createElement: type is invalid -- expected a string ' +
        '(for built-in components) or a class/function (for composite ' +
        'components) but got: null.' +
        '\n\nCheck your code at **.',
      {withoutStack: true},
    );
    expect(
      () => void (<True />),
    ).toErrorDev(
      'Warning: React.createElement: type is invalid -- expected a string ' +
        '(for built-in components) or a class/function (for composite ' +
        'components) but got: boolean.' +
        '\n\nCheck your code at **.',
      {withoutStack: true},
    );
    // No error expected
    void (<Div />);
  });

  it('should check default prop values', () => {
    RequiredPropComponent.defaultProps = {prop: null};

    expect(() =>
      ReactTestUtils.renderIntoDocument(<RequiredPropComponent />),
    ).toErrorDev(
      'Warning: Failed prop type: The prop `prop` is marked as required in ' +
        '`RequiredPropComponent`, but its value is `null`.\n' +
        '    in RequiredPropComponent (at **)',
    );
  });

  it('should not check the default for explicit null', () => {
    expect(() =>
      ReactTestUtils.renderIntoDocument(<RequiredPropComponent prop={null} />),
    ).toErrorDev(
      'Warning: Failed prop type: The prop `prop` is marked as required in ' +
        '`RequiredPropComponent`, but its value is `null`.\n' +
        '    in RequiredPropComponent (at **)',
    );
  });

  it('should check declared prop types', () => {
    expect(() =>
      ReactTestUtils.renderIntoDocument(<RequiredPropComponent />),
    ).toErrorDev(
      'Warning: Failed prop type: ' +
        'The prop `prop` is marked as required in `RequiredPropComponent`, but ' +
        'its value is `undefined`.\n' +
        '    in RequiredPropComponent (at **)',
    );
    expect(() =>
      ReactTestUtils.renderIntoDocument(<RequiredPropComponent prop={42} />),
    ).toErrorDev(
      'Warning: Failed prop type: ' +
        'Invalid prop `prop` of type `number` supplied to ' +
        '`RequiredPropComponent`, expected `string`.\n' +
        '    in RequiredPropComponent (at **)',
    );

    // Should not error for strings
    ReactTestUtils.renderIntoDocument(<RequiredPropComponent prop="string" />);
  });

  it('should warn on invalid prop types', () => {
    // Since there is no prevalidation step for ES6 classes, there is no hook
    // for us to issue a warning earlier than element creation when the error
    // actually occurs. Since this step is skipped in production, we should just
    // warn instead of throwing for this case.
    class NullPropTypeComponent extends React.Component {
      render() {
        return <span>{this.props.prop}</span>;
      }
    }
    NullPropTypeComponent.propTypes = {
      prop: null,
    };
    expect(() =>
      ReactTestUtils.renderIntoDocument(<NullPropTypeComponent />),
    ).toErrorDev(
      'NullPropTypeComponent: prop type `prop` is invalid; it must be a ' +
        'function, usually from the `prop-types` package,',
    );
  });

  it('should warn on invalid context types', () => {
    class NullContextTypeComponent extends React.Component {
      render() {
        return <span>{this.props.prop}</span>;
      }
    }
    NullContextTypeComponent.contextTypes = {
      prop: null,
    };
    expect(() =>
      ReactTestUtils.renderIntoDocument(<NullContextTypeComponent />),
    ).toErrorDev(
      'NullContextTypeComponent: context type `prop` is invalid; it must ' +
        'be a function, usually from the `prop-types` package,',
    );
  });

  it('should warn if getDefaultProps is specified on the class', () => {
    class GetDefaultPropsComponent extends React.Component {
      render() {
        return <span>{this.props.prop}</span>;
      }
    }
    GetDefaultPropsComponent.getDefaultProps = () => ({
      prop: 'foo',
    });
    expect(() =>
      ReactTestUtils.renderIntoDocument(<GetDefaultPropsComponent />),
    ).toErrorDev(
      'getDefaultProps is only used on classic React.createClass definitions.' +
        ' Use a static property named `defaultProps` instead.',
      {withoutStack: true},
    );
  });

  it('should warn if component declares PropTypes instead of propTypes', () => {
    class MisspelledPropTypesComponent extends React.Component {
      render() {
        return <span>{this.props.prop}</span>;
      }
    }
    MisspelledPropTypesComponent.PropTypes = {
      prop: PropTypes.string,
    };
    expect(() =>
      ReactTestUtils.renderIntoDocument(
        <MisspelledPropTypesComponent prop="hi" />,
      ),
    ).toErrorDev(
      'Warning: Component MisspelledPropTypesComponent declared `PropTypes` ' +
        'instead of `propTypes`. Did you misspell the property assignment?',
      {withoutStack: true},
    );
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

    expect(() => ReactTestUtils.renderIntoDocument(<Foo />)).toErrorDev(
      'Invalid attribute `ref` supplied to `React.Fragment`.',
    );
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
});
