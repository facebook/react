/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React = require('react');
let ReactDOM = require('react-dom');
let ReactFeatureFlags = require('shared/ReactFeatureFlags');
let ReactTestUtils = require('react-dom/test-utils');

if (!ReactFeatureFlags.disableModulePatternComponents) {
  describe('factory components', () => {
    it('Should correctly get the ref', () => {
      function Comp() {
        return {
          elemRef: React.createRef(),
          render() {
            return <div ref={this.elemRef} />;
          },
        };
      }

      let inst;
      expect(
        () => (inst = ReactTestUtils.renderIntoDocument(<Comp />)),
      ).toErrorDev(
        'Warning: The <Comp /> component appears to be a function component that returns a class instance. ' +
          'Change Comp to a class that extends React.Component instead. ' +
          "If you can't use a class try assigning the prototype on the function as a workaround. " +
          '`Comp.prototype = React.Component.prototype`. ' +
          "Don't use an arrow function since it cannot be called with `new` by React.",
      );
      expect(inst.elemRef.current.tagName).toBe('DIV');
    });
  });
}

/**
 * Tests that when a ref hops around children, we can track that correctly.
 */
describe('ref swapping', () => {
  let RefHopsAround;
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactTestUtils = require('react-dom/test-utils');

    RefHopsAround = class extends React.Component {
      state = {count: 0};
      hopRef = React.createRef();
      divOneRef = React.createRef();
      divTwoRef = React.createRef();
      divThreeRef = React.createRef();

      moveRef = () => {
        this.setState({count: this.state.count + 1});
      };

      render() {
        const count = this.state.count;
        /**
         * What we have here, is three divs with refs (div1/2/3), but a single
         * moving cursor ref `hopRef` that "hops" around the three. We'll call the
         * `moveRef()` function several times and make sure that the hop ref
         * points to the correct divs.
         */
        return (
          <div>
            <div
              className="first"
              ref={count % 3 === 0 ? this.hopRef : this.divOneRef}
            />
            <div
              className="second"
              ref={count % 3 === 1 ? this.hopRef : this.divTwoRef}
            />
            <div
              className="third"
              ref={count % 3 === 2 ? this.hopRef : this.divThreeRef}
            />
          </div>
        );
      }
    };
  });

  it('Allow refs to hop around children correctly', () => {
    const refHopsAround = ReactTestUtils.renderIntoDocument(<RefHopsAround />);

    const firstDiv = ReactTestUtils.findRenderedDOMComponentWithClass(
      refHopsAround,
      'first',
    );
    const secondDiv = ReactTestUtils.findRenderedDOMComponentWithClass(
      refHopsAround,
      'second',
    );
    const thirdDiv = ReactTestUtils.findRenderedDOMComponentWithClass(
      refHopsAround,
      'third',
    );

    expect(refHopsAround.hopRef.current).toEqual(firstDiv);
    expect(refHopsAround.divTwoRef.current).toEqual(secondDiv);
    expect(refHopsAround.divThreeRef.current).toEqual(thirdDiv);

    refHopsAround.moveRef();
    expect(refHopsAround.divOneRef.current).toEqual(firstDiv);
    expect(refHopsAround.hopRef.current).toEqual(secondDiv);
    expect(refHopsAround.divThreeRef.current).toEqual(thirdDiv);

    refHopsAround.moveRef();
    expect(refHopsAround.divOneRef.current).toEqual(firstDiv);
    expect(refHopsAround.divTwoRef.current).toEqual(secondDiv);
    expect(refHopsAround.hopRef.current).toEqual(thirdDiv);

    /**
     * Make sure that after the third, we're back to where we started and the
     * refs are completely restored.
     */
    refHopsAround.moveRef();
    expect(refHopsAround.hopRef.current).toEqual(firstDiv);
    expect(refHopsAround.divTwoRef.current).toEqual(secondDiv);
    expect(refHopsAround.divThreeRef.current).toEqual(thirdDiv);
  });

  it('always has a value for this.refs', () => {
    class Component extends React.Component {
      render() {
        return <div />;
      }
    }

    const instance = ReactTestUtils.renderIntoDocument(<Component />);
    expect(!!instance.refs).toBe(true);
  });

  it('ref called correctly for stateless component', () => {
    let refCalled = 0;
    function Inner(props) {
      return <a ref={props.saveA} />;
    }

    class Outer extends React.Component {
      saveA = () => {
        refCalled++;
      };

      componentDidMount() {
        this.setState({});
      }

      render() {
        return <Inner saveA={this.saveA} />;
      }
    }

    ReactTestUtils.renderIntoDocument(<Outer />);
    expect(refCalled).toBe(1);
  });

  it('throws on numbers', () => {
    class A extends React.Component {
      render() {
        return <div ref={1} />;
      }
    }
    expect(() => {
      ReactTestUtils.renderIntoDocument(<A />);
    }).toThrow(
      'Expected ref to be a function, an object returned by React.createRef(), or null.',
    );
  });

  it('provides an error for invalid refs', () => {
    expect(() => {
      ReactTestUtils.renderIntoDocument(<div ref={10} />);
    }).toThrow(
      'Expected ref to be a function, an object returned by React.createRef(), or null.',
    );
    expect(() => {
      ReactTestUtils.renderIntoDocument(<div ref={true} />);
    }).toThrow(
      'Expected ref to be a function, an object returned by React.createRef(), or null.',
    );
    expect(() => {
      ReactTestUtils.renderIntoDocument(<div ref={Symbol('foo')} />);
    }).toThrow(
      'Expected ref to be a function, an object returned by React.createRef(), or null.',
    );
    // This works
    ReactTestUtils.renderIntoDocument(<div ref={undefined} />);
    ReactTestUtils.renderIntoDocument({
      $$typeof: Symbol.for('react.element'),
      type: 'div',
      props: {},
      key: null,
      ref: null,
    });
    // But this doesn't
    expect(() => {
      ReactTestUtils.renderIntoDocument({
        $$typeof: Symbol.for('react.element'),
        type: 'div',
        props: {},
        key: null,
        ref: undefined,
      });
    }).toThrow(
      'Expected ref to be a function, an object returned by React.createRef(), or null.',
    );
  });

  it('should warn about callback refs returning a function', () => {
    const container = document.createElement('div');
    expect(() => {
      ReactDOM.render(<div ref={() => () => {}} />, container);
    }).toErrorDev('Unexpected return value from a callback ref in div');

    // Cleanup should warn, too.
    expect(() => {
      ReactDOM.render(<span />, container);
    }).toErrorDev('Unexpected return value from a callback ref in div', {
      withoutStack: true,
    });

    // No warning when returning non-functions.
    ReactDOM.render(<p ref={() => ({})} />, container);
    ReactDOM.render(<p ref={() => null} />, container);
    ReactDOM.render(<p ref={() => undefined} />, container);

    // Still warns on functions (not deduped).
    expect(() => {
      ReactDOM.render(<div ref={() => () => {}} />, container);
    }).toErrorDev('Unexpected return value from a callback ref in div');
    expect(() => {
      ReactDOM.unmountComponentAtNode(container);
    }).toErrorDev('Unexpected return value from a callback ref in div', {
      withoutStack: true,
    });
  });
});

describe('root level refs', () => {
  it('attaches and detaches root refs', () => {
    let inst = null;

    // host node
    let ref = jest.fn(value => (inst = value));
    const container = document.createElement('div');
    let result = ReactDOM.render(<div ref={ref} />, container);
    expect(ref).toHaveBeenCalledTimes(1);
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
    expect(result).toBe(ref.mock.calls[0][0]);
    ReactDOM.unmountComponentAtNode(container);
    expect(ref).toHaveBeenCalledTimes(2);
    expect(ref.mock.calls[1][0]).toBe(null);

    // composite
    class Comp extends React.Component {
      method() {
        return true;
      }
      render() {
        return <div>Comp</div>;
      }
    }

    inst = null;
    ref = jest.fn(value => (inst = value));
    result = ReactDOM.render(<Comp ref={ref} />, container);

    expect(ref).toHaveBeenCalledTimes(1);
    expect(inst).toBeInstanceOf(Comp);
    expect(result).toBe(inst);

    // ensure we have the correct instance
    expect(result.method()).toBe(true);
    expect(inst.method()).toBe(true);

    ReactDOM.unmountComponentAtNode(container);
    expect(ref).toHaveBeenCalledTimes(2);
    expect(ref.mock.calls[1][0]).toBe(null);

    // fragment
    inst = null;
    ref = jest.fn(value => (inst = value));
    let divInst = null;
    const ref2 = jest.fn(value => (divInst = value));
    result = ReactDOM.render(
      [
        <Comp ref={ref} key="a" />,
        5,
        <div ref={ref2} key="b">
          Hello
        </div>,
      ],
      container,
    );

    // first call should be `Comp`
    expect(ref).toHaveBeenCalledTimes(1);
    expect(ref.mock.calls[0][0]).toBeInstanceOf(Comp);
    expect(result).toBe(ref.mock.calls[0][0]);

    expect(ref2).toHaveBeenCalledTimes(1);
    expect(divInst).toBeInstanceOf(HTMLDivElement);
    expect(result).not.toBe(divInst);

    ReactDOM.unmountComponentAtNode(container);
    expect(ref).toHaveBeenCalledTimes(2);
    expect(ref.mock.calls[1][0]).toBe(null);
    expect(ref2).toHaveBeenCalledTimes(2);
    expect(ref2.mock.calls[1][0]).toBe(null);

    // null
    result = ReactDOM.render(null, container);
    expect(result).toBe(null);

    // primitives
    result = ReactDOM.render(5, container);
    expect(result).toBeInstanceOf(Text);
  });
});

describe('creating element with string ref in constructor', () => {
  class RefTest extends React.Component {
    constructor(props) {
      super(props);
      this.p = <p ref="p">Hello!</p>;
    }

    render() {
      return <div>{this.p}</div>;
    }
  }

  it('throws an error', () => {
    ReactTestUtils = require('react-dom/test-utils');

    expect(function() {
      expect(() => {
        ReactTestUtils.renderIntoDocument(<RefTest />);
      }).toErrorDev(['']);
    }).toThrowError();
  });
});
