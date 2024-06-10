/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let act;
let React;
let ReactDOMClient;

describe('ReactElementClone', () => {
  let ComponentClass;

  beforeEach(() => {
    jest.resetModules();

    act = require('internal-test-utils').act;

    React = require('react');
    ReactDOMClient = require('react-dom/client');

    // NOTE: We're explicitly not using JSX here. This is intended to test
    // classic JS without JSX.
    ComponentClass = class extends React.Component {
      render() {
        return React.createElement('div');
      }
    };
  });

  it('should clone a DOM component with new props', async () => {
    let div;
    class Grandparent extends React.Component {
      render() {
        return (
          <Parent
            child={<div ref={node => (div = node)} className="child" />}
          />
        );
      }
    }
    class Parent extends React.Component {
      render() {
        return (
          <div className="parent">
            {React.cloneElement(this.props.child, {className: 'xyz'})}
          </div>
        );
      }
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await act(() => {
      root.render(<Grandparent />);
    });
    expect(div.className).toBe('xyz');
  });

  it('should clone a composite component with new props', async () => {
    let div;
    class Child extends React.Component {
      render() {
        return (
          <div ref={node => (div = node)} className={this.props.className} />
        );
      }
    }
    class Grandparent extends React.Component {
      render() {
        return <Parent child={<Child className="child" />} />;
      }
    }
    class Parent extends React.Component {
      render() {
        return (
          <div className="parent">
            {React.cloneElement(this.props.child, {className: 'xyz'})}
          </div>
        );
      }
    }
    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await act(() => {
      root.render(<Grandparent />);
    });
    expect(div.className).toBe('xyz');
  });

  it('does not fail if config has no prototype', () => {
    const config = Object.create(null, {foo: {value: 1, enumerable: true}});
    React.cloneElement(<div />, config);
  });

  it('should keep the original ref if it is not overridden', async () => {
    let component;
    class Grandparent extends React.Component {
      yoloRef = React.createRef();

      componentDidMount() {
        component = this;
      }

      render() {
        return <Parent child={<div ref={this.yoloRef} />} />;
      }
    }

    class Parent extends React.Component {
      render() {
        return (
          <div>{React.cloneElement(this.props.child, {className: 'xyz'})}</div>
        );
      }
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await act(() => {
      root.render(<Grandparent />);
    });

    expect(component.yoloRef.current.tagName).toBe('DIV');
  });

  it('should transfer the key property', () => {
    class Component extends React.Component {
      render() {
        return null;
      }
    }
    const clone = React.cloneElement(<Component />, {key: 'xyz'});
    expect(clone.key).toBe('xyz');
  });

  it('should transfer children', async () => {
    class Component extends React.Component {
      render() {
        expect(this.props.children).toBe('xyz');
        return <div />;
      }
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await act(() => {
      root.render(React.cloneElement(<Component />, {children: 'xyz'}));
    });
  });

  it('should shallow clone children', async () => {
    class Component extends React.Component {
      render() {
        expect(this.props.children).toBe('xyz');
        return <div />;
      }
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await act(() => {
      root.render(React.cloneElement(<Component>xyz</Component>, {}));
    });
  });

  it('should accept children as rest arguments', () => {
    class Component extends React.Component {
      render() {
        return null;
      }
    }

    const clone = React.cloneElement(
      <Component>xyz</Component>,
      {children: <Component />},
      <div />,
      <span />,
    );

    expect(clone.props.children).toEqual([<div />, <span />]);
  });

  it('should override children if undefined is provided as an argument', () => {
    const element = React.createElement(
      ComponentClass,
      {
        children: 'text',
      },
      undefined,
    );
    expect(element.props.children).toBe(undefined);

    const element2 = React.cloneElement(
      React.createElement(ComponentClass, {
        children: 'text',
      }),
      {},
      undefined,
    );
    expect(element2.props.children).toBe(undefined);
  });

  it('should support keys and refs', async () => {
    let component;
    class Parent extends React.Component {
      xyzRef = React.createRef();

      render() {
        const clone = React.cloneElement(this.props.children, {
          key: 'xyz',
          ref: this.xyzRef,
        });
        expect(clone.key).toBe('xyz');
        if (gate(flags => flags.enableRefAsProp)) {
          expect(clone.props.ref).toBe(this.xyzRef);
        } else {
          expect(clone.ref).toBe(this.xyzRef);
        }
        return <div>{clone}</div>;
      }
    }

    class Grandparent extends React.Component {
      parentRef = React.createRef();

      componentDidMount() {
        component = this;
      }

      render() {
        return (
          <Parent ref={this.parentRef}>
            <span key="abc" />
          </Parent>
        );
      }
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await act(() => root.render(<Grandparent />));
    expect(component.parentRef.current.xyzRef.current.tagName).toBe('SPAN');
  });

  it('should steal the ref if a new ref is specified', async () => {
    let component;
    class Parent extends React.Component {
      xyzRef = React.createRef();

      render() {
        const clone = React.cloneElement(this.props.children, {
          ref: this.xyzRef,
        });
        return <div>{clone}</div>;
      }
    }

    class Grandparent extends React.Component {
      parentRef = React.createRef();
      childRef = React.createRef();

      componentDidMount() {
        component = this;
      }

      render() {
        return (
          <Parent ref={this.parentRef}>
            <span ref={this.childRef} />
          </Parent>
        );
      }
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await act(() => root.render(<Grandparent />));
    if (gate(flags => flags.enableRefAsProp && flags.disableStringRefs)) {
      expect(component.childRef).toEqual({current: null});
      expect(component.parentRef.current.xyzRef.current.tagName).toBe('SPAN');
    } else if (
      gate(flags => !flags.enableRefAsProp && !flags.disableStringRefs)
    ) {
      expect(component.childRef).toEqual({current: null});
      expect(component.parentRef.current.xyzRef.current.tagName).toBe('SPAN');
    } else if (
      gate(flags => flags.enableRefAsProp && !flags.disableStringRefs)
    ) {
      expect(component.childRef).toEqual({current: null});
      expect(component.parentRef.current.xyzRef.current.tagName).toBe('SPAN');
    } else {
      // Not going to bother testing every possible combination.
    }
  });

  // @gate !disableStringRefs
  it('should steal the ref if a new string ref is specified without an owner', async () => {
    // Regression test for this specific feature combination calling cloneElement on an element
    // without an owner
    await expect(async () => {
      // create an element without an owner
      const element = React.createElement('div', {id: 'some-id'});
      class Parent extends React.Component {
        render() {
          return <Child>{element}</Child>;
        }
      }
      let child;
      class Child extends React.Component {
        render() {
          child = this;
          const clone = React.cloneElement(this.props.children, {
            ref: 'xyz',
          });
          return <div>{clone}</div>;
        }
      }

      const root = ReactDOMClient.createRoot(document.createElement('div'));
      await act(() => root.render(<Parent />));
      expect(child.refs.xyz.tagName).toBe('DIV');
    }).toErrorDev([
      'Component "Child" contains the string ref "xyz". Support for ' +
        'string refs will be removed in a future major release. We recommend ' +
        'using useRef() or createRef() instead. Learn more about using refs ' +
        'safely here: https://react.dev/link/strict-mode-string-ref',
    ]);
  });

  it('should overwrite props', async () => {
    class Component extends React.Component {
      render() {
        expect(this.props.myprop).toBe('xyz');
        return <div />;
      }
    }

    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await act(() =>
      root.render(
        React.cloneElement(<Component myprop="abc" />, {myprop: 'xyz'}),
      ),
    );
  });

  // @gate !disableDefaultPropsExceptForClasses
  it('should normalize props with default values', () => {
    class Component extends React.Component {
      render() {
        return <span />;
      }
    }
    Component.defaultProps = {prop: 'testKey'};

    const instance = React.createElement(Component);
    const clonedInstance = React.cloneElement(instance, {prop: undefined});
    expect(clonedInstance.props.prop).toBe('testKey');
    const clonedInstance2 = React.cloneElement(instance, {prop: null});
    expect(clonedInstance2.props.prop).toBe(null);

    const instance2 = React.createElement(Component, {prop: 'newTestKey'});
    const cloneInstance3 = React.cloneElement(instance2, {prop: undefined});
    expect(cloneInstance3.props.prop).toBe('testKey');
    const cloneInstance4 = React.cloneElement(instance2, {});
    expect(cloneInstance4.props.prop).toBe('newTestKey');
  });

  it('warns for keys for arrays of elements in rest args', async () => {
    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await expect(async () => {
      await act(() => {
        root.render(React.cloneElement(<div />, null, [<div />, <div />]));
      });
    }).toErrorDev('Each child in a list should have a unique "key" prop.');
  });

  it('does not warns for arrays of elements with keys', async () => {
    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await act(() => {
      root.render(
        React.cloneElement(<div />, null, [<div key="#1" />, <div key="#2" />]),
      );
    });
  });

  it('does not warn when the element is directly in rest args', async () => {
    const root = ReactDOMClient.createRoot(document.createElement('div'));
    await act(() => {
      root.render(React.cloneElement(<div />, null, <div />, <div />));
    });
  });

  it('does not warn when the array contains a non-element', () => {
    React.cloneElement(<div />, null, [{}, {}]);
  });

  it('should ignore key and ref warning getters', () => {
    const elementA = React.createElement('div');
    const elementB = React.cloneElement(elementA, elementA.props);
    expect(elementB.key).toBe(null);
    if (gate(flags => flags.enableRefAsProp)) {
      expect(elementB.ref).toBe(null);
    } else {
      expect(elementB.ref).toBe(null);
    }
  });

  it('should ignore undefined key and ref', () => {
    const element = React.createElement(ComponentClass, {
      key: '12',
      ref: '34',
      foo: '56',
    });
    const props = {
      key: undefined,
      ref: undefined,
      foo: 'ef',
    };
    const clone = React.cloneElement(element, props);
    expect(clone.type).toBe(ComponentClass);
    expect(clone.key).toBe('12');
    if (gate(flags => flags.enableRefAsProp && flags.disableStringRefs)) {
      expect(clone.props.ref).toBe('34');
      expect(() => expect(clone.ref).toBe('34')).toErrorDev(
        'Accessing element.ref was removed in React 19',
        {withoutStack: true},
      );
      expect(clone.props).toEqual({foo: 'ef', ref: '34'});
    } else if (
      gate(flags => !flags.enableRefAsProp && !flags.disableStringRefs)
    ) {
      expect(clone.ref).toBe(element.ref);
      expect(clone.props).toEqual({foo: 'ef'});
    } else if (
      gate(flags => flags.enableRefAsProp && !flags.disableStringRefs)
    ) {
      expect(() => {
        expect(clone.ref).toBe(element.ref);
      }).toErrorDev('Accessing element.ref was removed in React 19', {
        withoutStack: true,
      });
      expect(clone.props).toEqual({foo: 'ef', ref: element.ref});
    } else {
      // Not going to bother testing every possible combination.
    }
    if (__DEV__) {
      expect(Object.isFrozen(element)).toBe(true);
      expect(Object.isFrozen(element.props)).toBe(true);
    }
  });

  it('should extract null key and ref', () => {
    const element = React.createElement(ComponentClass, {
      key: '12',
      ref: '34',
      foo: '56',
    });
    const props = {
      key: null,
      ref: null,
      foo: 'ef',
    };
    const clone = React.cloneElement(element, props);
    expect(clone.type).toBe(ComponentClass);
    expect(clone.key).toBe('null');
    if (gate(flags => flags.enableRefAsProp)) {
      expect(clone.ref).toBe(null);
      expect(clone.props).toEqual({foo: 'ef', ref: null});
    } else {
      expect(clone.ref).toBe(null);
      expect(clone.props).toEqual({foo: 'ef'});
    }

    if (__DEV__) {
      expect(Object.isFrozen(element)).toBe(true);
      expect(Object.isFrozen(element.props)).toBe(true);
    }
  });

  it('throws an error if passed null', () => {
    const element = null;
    expect(() => React.cloneElement(element)).toThrow(
      'The argument must be a React element, but you passed null.',
    );
  });

  it('throws an error if passed undefined', () => {
    let element;
    expect(() => React.cloneElement(element)).toThrow(
      'The argument must be a React element, but you passed undefined.',
    );
  });
});
