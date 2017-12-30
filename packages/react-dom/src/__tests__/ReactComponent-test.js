/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let ReactDOMServer;
let ReactTestUtils;

describe('ReactComponent', () => {
  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    ReactTestUtils = require('react-dom/test-utils');
  });

  it('should throw on invalid render targets', () => {
    const container = document.createElement('div');
    // jQuery objects are basically arrays; people often pass them in by mistake
    expect(function() {
      ReactDOM.render(<div />, [container]);
    }).toThrowError(/Target container is not a DOM element./);

    expect(function() {
      ReactDOM.render(<div />, null);
    }).toThrowError(/Target container is not a DOM element./);
  });

  it('should throw when supplying a ref outside of render method', () => {
    let instance = <div ref="badDiv" />;
    expect(function() {
      instance = ReactTestUtils.renderIntoDocument(instance);
    }).toThrow();
  });

  it('should throw (in dev) when children are mutated during render', () => {
    spyOnDev(console, 'error');
    function Wrapper(props) {
      props.children[1] = <p key={1} />; // Mutation is illegal
      return <div>{props.children}</div>;
    }
    if (__DEV__) {
      expect(() => {
        ReactTestUtils.renderIntoDocument(
          <Wrapper>
            <span key={0} />
            <span key={1} />
            <span key={2} />
          </Wrapper>,
        );
      }).toThrowError(/Cannot assign to read only property.*/);
    } else {
      ReactTestUtils.renderIntoDocument(
        <Wrapper>
          <span key={0} />
          <span key={1} />
          <span key={2} />
        </Wrapper>,
      );
    }
  });

  it('should throw (in dev) when children are mutated during update', () => {
    spyOnDev(console, 'error');

    class Wrapper extends React.Component {
      componentDidMount() {
        this.props.children[1] = <p key={1} />; // Mutation is illegal
        this.forceUpdate();
      }

      render() {
        return <div>{this.props.children}</div>;
      }
    }

    if (__DEV__) {
      expect(() => {
        ReactTestUtils.renderIntoDocument(
          <Wrapper>
            <span key={0} />
            <span key={1} />
            <span key={2} />
          </Wrapper>,
        );
      }).toThrowError(/Cannot assign to read only property.*/);
    } else {
      ReactTestUtils.renderIntoDocument(
        <Wrapper>
          <span key={0} />
          <span key={1} />
          <span key={2} />
        </Wrapper>,
      );
    }
  });

  it('should support refs on owned components', () => {
    const innerObj = {};
    const outerObj = {};

    class Wrapper extends React.Component {
      getObject = () => {
        return this.props.object;
      };

      render() {
        return <div>{this.props.children}</div>;
      }
    }

    class Component extends React.Component {
      render() {
        const inner = <Wrapper object={innerObj} ref="inner" />;
        const outer = (
          <Wrapper object={outerObj} ref="outer">
            {inner}
          </Wrapper>
        );
        return outer;
      }

      componentDidMount() {
        expect(this.refs.inner.getObject()).toEqual(innerObj);
        expect(this.refs.outer.getObject()).toEqual(outerObj);
      }
    }

    ReactTestUtils.renderIntoDocument(<Component />);
  });

  it('should not have refs on unmounted components', () => {
    class Parent extends React.Component {
      render() {
        return (
          <Child>
            <div ref="test" />
          </Child>
        );
      }

      componentDidMount() {
        expect(this.refs && this.refs.test).toEqual(undefined);
      }
    }

    class Child extends React.Component {
      render() {
        return <div />;
      }
    }

    ReactTestUtils.renderIntoDocument(<Parent child={<span />} />);
  });

  it('should support new-style refs', () => {
    const innerObj = {};
    const outerObj = {};

    class Wrapper extends React.Component {
      getObject = () => {
        return this.props.object;
      };

      render() {
        return <div>{this.props.children}</div>;
      }
    }

    let mounted = false;

    class Component extends React.Component {
      render() {
        const inner = (
          <Wrapper object={innerObj} ref={c => (this.innerRef = c)} />
        );
        const outer = (
          <Wrapper object={outerObj} ref={c => (this.outerRef = c)}>
            {inner}
          </Wrapper>
        );
        return outer;
      }

      componentDidMount() {
        expect(this.innerRef.getObject()).toEqual(innerObj);
        expect(this.outerRef.getObject()).toEqual(outerObj);
        mounted = true;
      }
    }

    ReactTestUtils.renderIntoDocument(<Component />);
    expect(mounted).toBe(true);
  });

  it('should support new-style refs with mixed-up owners', () => {
    class Wrapper extends React.Component {
      getTitle = () => {
        return this.props.title;
      };

      render() {
        return this.props.getContent();
      }
    }

    let mounted = false;

    class Component extends React.Component {
      getInner = () => {
        // (With old-style refs, it's impossible to get a ref to this div
        // because Wrapper is the current owner when this function is called.)
        return <div className="inner" ref={c => (this.innerRef = c)} />;
      };

      render() {
        return (
          <Wrapper
            title="wrapper"
            ref={c => (this.wrapperRef = c)}
            getContent={this.getInner}
          />
        );
      }

      componentDidMount() {
        // Check .props.title to make sure we got the right elements back
        expect(this.wrapperRef.getTitle()).toBe('wrapper');
        expect(ReactDOM.findDOMNode(this.innerRef).className).toBe('inner');
        mounted = true;
      }
    }

    ReactTestUtils.renderIntoDocument(<Component />);
    expect(mounted).toBe(true);
  });

  it('should call refs at the correct time', () => {
    const log = [];

    class Inner extends React.Component {
      render() {
        log.push(`inner ${this.props.id} render`);
        return <div />;
      }

      componentDidMount() {
        log.push(`inner ${this.props.id} componentDidMount`);
      }

      componentDidUpdate() {
        log.push(`inner ${this.props.id} componentDidUpdate`);
      }

      componentWillUnmount() {
        log.push(`inner ${this.props.id} componentWillUnmount`);
      }
    }

    class Outer extends React.Component {
      render() {
        return (
          <div>
            <Inner
              id={1}
              ref={c => {
                log.push(`ref 1 got ${c ? `instance ${c.props.id}` : 'null'}`);
              }}
            />
            <Inner
              id={2}
              ref={c => {
                log.push(`ref 2 got ${c ? `instance ${c.props.id}` : 'null'}`);
              }}
            />
          </div>
        );
      }

      componentDidMount() {
        log.push('outer componentDidMount');
      }

      componentDidUpdate() {
        log.push('outer componentDidUpdate');
      }

      componentWillUnmount() {
        log.push('outer componentWillUnmount');
      }
    }

    // mount, update, unmount
    const el = document.createElement('div');
    log.push('start mount');
    ReactDOM.render(<Outer />, el);
    log.push('start update');
    ReactDOM.render(<Outer />, el);
    log.push('start unmount');
    ReactDOM.unmountComponentAtNode(el);

    /* eslint-disable indent */
    expect(log).toEqual([
      'start mount',
      'inner 1 render',
      'inner 2 render',
      'inner 1 componentDidMount',
      'ref 1 got instance 1',
      'inner 2 componentDidMount',
      'ref 2 got instance 2',
      'outer componentDidMount',
      'start update',
      // Previous (equivalent) refs get cleared
      // Fiber renders first, resets refs later
      'inner 1 render',
      'inner 2 render',
      'ref 1 got null',
      'ref 2 got null',
      'inner 1 componentDidUpdate',
      'ref 1 got instance 1',
      'inner 2 componentDidUpdate',
      'ref 2 got instance 2',
      'outer componentDidUpdate',
      'start unmount',
      'outer componentWillUnmount',
      'ref 1 got null',
      'inner 1 componentWillUnmount',
      'ref 2 got null',
      'inner 2 componentWillUnmount',
    ]);
    /* eslint-enable indent */
  });

  it('fires the callback after a component is rendered', () => {
    const callback = jest.fn();
    const container = document.createElement('div');
    ReactDOM.render(<div />, container, callback);
    expect(callback.mock.calls.length).toBe(1);
    ReactDOM.render(<div className="foo" />, container, callback);
    expect(callback.mock.calls.length).toBe(2);
    ReactDOM.render(<span />, container, callback);
    expect(callback.mock.calls.length).toBe(3);
  });

  it('throws usefully when rendering badly-typed elements', () => {
    spyOnDev(console, 'error');

    const X = undefined;
    expect(() => ReactTestUtils.renderIntoDocument(<X />)).toThrowError(
      'Element type is invalid: expected a string (for built-in components) ' +
        'or a class/function (for composite components) but got: undefined.' +
        (__DEV__
          ? " You likely forgot to export your component from the file it's " +
            'defined in, or you might have mixed up default and named imports.'
          : ''),
    );

    const Y = null;
    expect(() => ReactTestUtils.renderIntoDocument(<Y />)).toThrowError(
      'Element type is invalid: expected a string (for built-in components) ' +
        'or a class/function (for composite components) but got: null.',
    );

    if (__DEV__) {
      // One warning for each element creation
      expect(console.error.calls.count()).toBe(2);
    }
  });

  it('includes owner name in the error about badly-typed elements', () => {
    spyOnDev(console, 'error');

    const X = undefined;

    function Indirection(props) {
      return <div>{props.children}</div>;
    }

    function Bar() {
      return (
        <Indirection>
          <X />
        </Indirection>
      );
    }

    function Foo() {
      return <Bar />;
    }

    expect(() => ReactTestUtils.renderIntoDocument(<Foo />)).toThrowError(
      'Element type is invalid: expected a string (for built-in components) ' +
        'or a class/function (for composite components) but got: undefined.' +
        (__DEV__
          ? " You likely forgot to export your component from the file it's " +
            'defined in, or you might have mixed up default and named imports.' +
            '\n\nCheck the render method of `Bar`.'
          : ''),
    );

    if (__DEV__) {
      // One warning for each element creation
      expect(console.error.calls.count()).toBe(1);
    }
  });

  it('throws if a plain object is used as a child', () => {
    const children = {
      x: <span />,
      y: <span />,
      z: <span />,
    };
    const element = <div>{[children]}</div>;
    const container = document.createElement('div');
    let ex;
    try {
      ReactDOM.render(element, container);
    } catch (e) {
      ex = e;
    }
    expect(ex).toBeDefined();
    expect(normalizeCodeLocInfo(ex.message)).toBe(
      'Objects are not valid as a React child (found: object with keys {x, y, z}).' +
        (__DEV__
          ? ' If you meant to render a collection of children, use ' +
            'an array instead.' +
            '\n    in div (at **)'
          : ''),
    );
  });

  it('throws if a plain object even if it is in an owner', () => {
    class Foo extends React.Component {
      render() {
        const children = {
          a: <span />,
          b: <span />,
          c: <span />,
        };
        return <div>{[children]}</div>;
      }
    }
    const container = document.createElement('div');
    let ex;
    try {
      ReactDOM.render(<Foo />, container);
    } catch (e) {
      ex = e;
    }
    expect(ex).toBeDefined();
    expect(normalizeCodeLocInfo(ex.message)).toBe(
      'Objects are not valid as a React child (found: object with keys {a, b, c}).' +
        (__DEV__
          ? ' If you meant to render a collection of children, use ' +
            'an array instead.\n' +
            '    in div (at **)\n' +
            '    in Foo (at **)'
          : ''),
    );
  });

  it('throws if a plain object is used as a child when using SSR', async () => {
    const children = {
      x: <span />,
      y: <span />,
      z: <span />,
    };
    const element = <div>{[children]}</div>;
    let ex;
    try {
      ReactDOMServer.renderToString(element);
    } catch (e) {
      ex = e;
    }
    expect(ex).toBeDefined();
    expect(normalizeCodeLocInfo(ex.message)).toBe(
      'Objects are not valid as a React child (found: object with keys {x, y, z}).' +
        (__DEV__
          ? ' If you meant to render a collection of children, use ' +
            'an array instead.' +
            '\n    in div (at **)'
          : ''),
    );
  });

  it('throws if a plain object even if it is in an owner when using SSR', async () => {
    class Foo extends React.Component {
      render() {
        const children = {
          a: <span />,
          b: <span />,
          c: <span />,
        };
        return <div>{[children]}</div>;
      }
    }
    const container = document.createElement('div');
    let ex;
    try {
      ReactDOMServer.renderToString(<Foo />, container);
    } catch (e) {
      ex = e;
    }
    expect(ex).toBeDefined();
    expect(normalizeCodeLocInfo(ex.message)).toBe(
      'Objects are not valid as a React child (found: object with keys {a, b, c}).' +
        (__DEV__
          ? ' If you meant to render a collection of children, use ' +
            'an array instead.\n' +
            '    in div (at **)\n' +
            '    in Foo (at **)'
          : ''),
    );
  });

  describe('with new features', () => {
    it('warns on function as a return value from a function', () => {
      function Foo() {
        return Foo;
      }
      spyOnDev(console, 'error');
      const container = document.createElement('div');
      ReactDOM.render(<Foo />, container);
      if (__DEV__) {
        expect(console.error.calls.count()).toBe(1);
        expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
          'Warning: Functions are not valid as a React child. This may happen if ' +
            'you return a Component instead of <Component /> from render. ' +
            'Or maybe you meant to call this function rather than return it.\n' +
            '    in Foo (at **)',
        );
      }
    });

    it('warns on function as a return value from a class', () => {
      class Foo extends React.Component {
        render() {
          return Foo;
        }
      }
      spyOnDev(console, 'error');
      const container = document.createElement('div');
      ReactDOM.render(<Foo />, container);
      if (__DEV__) {
        expect(console.error.calls.count()).toBe(1);
        expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
          'Warning: Functions are not valid as a React child. This may happen if ' +
            'you return a Component instead of <Component /> from render. ' +
            'Or maybe you meant to call this function rather than return it.\n' +
            '    in Foo (at **)',
        );
      }
    });

    it('warns on function as a child to host component', () => {
      function Foo() {
        return (
          <div>
            <span>{Foo}</span>
          </div>
        );
      }
      spyOnDev(console, 'error');
      const container = document.createElement('div');
      ReactDOM.render(<Foo />, container);
      if (__DEV__) {
        expect(console.error.calls.count()).toBe(1);
        expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
          'Warning: Functions are not valid as a React child. This may happen if ' +
            'you return a Component instead of <Component /> from render. ' +
            'Or maybe you meant to call this function rather than return it.\n' +
            '    in span (at **)\n' +
            '    in div (at **)\n' +
            '    in Foo (at **)',
        );
      }
    });

    it('does not warn for function-as-a-child that gets resolved', () => {
      function Bar(props) {
        return props.children();
      }
      function Foo() {
        return <Bar>{() => 'Hello'}</Bar>;
      }
      const container = document.createElement('div');
      ReactDOM.render(<Foo />, container);
      expect(container.innerHTML).toBe('Hello');
    });

    it('deduplicates function type warnings based on component type', () => {
      spyOnDev(console, 'error');
      class Foo extends React.PureComponent {
        constructor() {
          super();
          this.state = {type: 'mushrooms'};
        }
        render() {
          return (
            <div>
              {Foo}
              {Foo}
              <span>
                {Foo}
                {Foo}
              </span>
            </div>
          );
        }
      }
      const container = document.createElement('div');
      const component = ReactDOM.render(<Foo />, container);
      component.setState({type: 'portobello mushrooms'});
      if (__DEV__) {
        expect(console.error.calls.count()).toBe(2);
        expect(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
          'Warning: Functions are not valid as a React child. This may happen if ' +
            'you return a Component instead of <Component /> from render. ' +
            'Or maybe you meant to call this function rather than return it.\n' +
            '    in div (at **)\n' +
            '    in Foo (at **)',
        );
        expect(normalizeCodeLocInfo(console.error.calls.argsFor(1)[0])).toBe(
          'Warning: Functions are not valid as a React child. This may happen if ' +
            'you return a Component instead of <Component /> from render. ' +
            'Or maybe you meant to call this function rather than return it.\n' +
            '    in span (at **)\n' +
            '    in div (at **)\n' +
            '    in Foo (at **)',
        );
      }
    });
  });
});
