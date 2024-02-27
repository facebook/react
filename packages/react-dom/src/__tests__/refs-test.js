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
let ReactDOMClient = require('react-dom/client');
let ReactFeatureFlags = require('shared/ReactFeatureFlags');
let act = require('internal-test-utils').act;

// This is testing if string refs are deleted from `instance.refs`
// Once support for string refs is removed, this test can be removed.
// Detaching is already tested in refs-detruction-test.js
describe('reactiverefs', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    act = require('internal-test-utils').act;
  });

  afterEach(() => {
    if (container) {
      document.body.removeChild(container);
      container = null;
    }
  });

  /**
   * Counts clicks and has a renders an item for each click. Each item rendered
   * has a ref of the form "clickLogN".
   */
  class ClickCounter extends React.Component {
    state = {count: this.props.initialCount};

    triggerReset = () => {
      this.setState({count: this.props.initialCount});
    };

    handleClick = () => {
      this.setState({count: this.state.count + 1});
    };

    render() {
      const children = [];
      let i;
      for (i = 0; i < this.state.count; i++) {
        children.push(
          <div
            className="clickLogDiv"
            key={'clickLog' + i}
            ref={'clickLog' + i}
          />,
        );
      }
      return (
        <span className="clickIncrementer" onClick={this.handleClick}>
          {children}
        </span>
      );
    }
  }

  const expectClickLogsLengthToBe = function (instance, length) {
    const clickLogs = instance.container.querySelectorAll('.clickLogDiv');
    expect(clickLogs.length).toBe(length);
    expect(Object.keys(instance.refs.myCounter.refs).length).toBe(length);
  };

  /**
   * Render a TestRefsComponent and ensure that the main refs are wired up.
   */
  const renderTestRefsComponent = async function () {
    /**
     * Only purpose is to test that refs are tracked even when applied to a
     * component that is injected down several layers. Ref systems are difficult to
     * build in such a way that ownership is maintained in an airtight manner.
     */
    class GeneralContainerComponent extends React.Component {
      render() {
        return <div>{this.props.children}</div>;
      }
    }

    /**
     * Notice how refs ownership is maintained even when injecting a component
     * into a different parent.
     */
    class TestRefsComponent extends React.Component {
      container = null;
      doReset = () => {
        this.refs.myCounter.triggerReset();
      };

      render() {
        return (
          <div ref={current => (this.container = current)}>
            <div ref="resetDiv" onClick={this.doReset}>
              Reset Me By Clicking This.
            </div>
            <GeneralContainerComponent ref="myContainer">
              <ClickCounter ref="myCounter" initialCount={1} />
            </GeneralContainerComponent>
          </div>
        );
      }
    }

    container = document.createElement('div');
    document.body.appendChild(container);

    let testRefsComponent;
    await expect(async () => {
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(
          <TestRefsComponent
            ref={current => {
              testRefsComponent = current;
            }}
          />,
        );
      });
    }).toErrorDev([
      'Warning: Component "div" contains the string ref "resetDiv". ' +
        'Support for string refs will be removed in a future major release. ' +
        'We recommend using useRef() or createRef() instead. ' +
        'Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref\n' +
        '    in div (at **)\n' +
        '    in TestRefsComponent (at **)',
      'Warning: Component "span" contains the string ref "clickLog0". ' +
        'Support for string refs will be removed in a future major release. ' +
        'We recommend using useRef() or createRef() instead. ' +
        'Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref\n' +
        '    in span (at **)\n' +
        '    in ClickCounter (at **)\n' +
        '    in div (at **)\n' +
        '    in GeneralContainerComponent (at **)\n' +
        '    in div (at **)\n' +
        '    in TestRefsComponent (at **)',
    ]);

    expect(testRefsComponent instanceof TestRefsComponent).toBe(true);

    const generalContainer = testRefsComponent.refs.myContainer;
    expect(generalContainer instanceof GeneralContainerComponent).toBe(true);

    const counter = testRefsComponent.refs.myCounter;
    expect(counter instanceof ClickCounter).toBe(true);

    return testRefsComponent;
  };

  /**
   * Ensure that for every click log there is a corresponding ref (from the
   * perspective of the injected ClickCounter component.
   */
  // @gate !disableStringRefs
  it('Should increase refs with an increase in divs', async () => {
    const testRefsComponent = await renderTestRefsComponent();
    const clickIncrementer =
      testRefsComponent.container.querySelector('.clickIncrementer');

    expectClickLogsLengthToBe(testRefsComponent, 1);

    // After clicking the reset, there should still only be one click log ref.
    testRefsComponent.refs.resetDiv.click();
    expectClickLogsLengthToBe(testRefsComponent, 1);

    // Begin incrementing clicks (and therefore refs).
    await act(() => {
      clickIncrementer.click();
    });
    expectClickLogsLengthToBe(testRefsComponent, 2);

    await act(() => {
      clickIncrementer.click();
    });
    expectClickLogsLengthToBe(testRefsComponent, 3);

    // Now reset again
    await act(() => {
      testRefsComponent.refs.resetDiv.click();
    });
    expectClickLogsLengthToBe(testRefsComponent, 1);
  });
});

if (!ReactFeatureFlags.disableModulePatternComponents) {
  describe('factory components', () => {
    it('Should correctly get the ref', async () => {
      function Comp() {
        return {
          elemRef: React.createRef(),
          render() {
            return <div ref={this.elemRef} />;
          },
        };
      }

      let inst;
      await expect(async () => {
        const container = document.createElement('div');
        const root = ReactDOMClient.createRoot(container);

        await act(() => {
          root.render(<Comp ref={current => (inst = current)} />);
        });
      }).toErrorDev(
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
    ReactDOMClient = require('react-dom/client');
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    act = require('internal-test-utils').act;

    RefHopsAround = class extends React.Component {
      container = null;
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
          <div ref={current => (this.container = current)}>
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

  it('Allow refs to hop around children correctly', async () => {
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);

    let refHopsAround;
    await act(() => {
      root.render(<RefHopsAround ref={current => (refHopsAround = current)} />);
    });

    const firstDiv = refHopsAround.container.querySelector('.first');
    const secondDiv = refHopsAround.container.querySelector('.second');
    const thirdDiv = refHopsAround.container.querySelector('.third');

    expect(refHopsAround.hopRef.current).toEqual(firstDiv);
    expect(refHopsAround.divTwoRef.current).toEqual(secondDiv);
    expect(refHopsAround.divThreeRef.current).toEqual(thirdDiv);

    await act(() => {
      refHopsAround.moveRef();
    });
    expect(refHopsAround.divOneRef.current).toEqual(firstDiv);
    expect(refHopsAround.hopRef.current).toEqual(secondDiv);
    expect(refHopsAround.divThreeRef.current).toEqual(thirdDiv);

    await act(() => {
      refHopsAround.moveRef();
    });
    expect(refHopsAround.divOneRef.current).toEqual(firstDiv);
    expect(refHopsAround.divTwoRef.current).toEqual(secondDiv);
    expect(refHopsAround.hopRef.current).toEqual(thirdDiv);

    /**
     * Make sure that after the third, we're back to where we started and the
     * refs are completely restored.
     */
    await act(() => {
      refHopsAround.moveRef();
    });
    expect(refHopsAround.hopRef.current).toEqual(firstDiv);
    expect(refHopsAround.divTwoRef.current).toEqual(secondDiv);
    expect(refHopsAround.divThreeRef.current).toEqual(thirdDiv);
  });

  it('always has a value for this.refs', async () => {
    class Component extends React.Component {
      render() {
        return <div />;
      }
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    let instance;
    await act(() => {
      root.render(<Component ref={current => (instance = current)} />);
    });
    expect(!!instance.refs).toBe(true);
  });

  it('ref called correctly for stateless component', async () => {
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

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<Outer />);
    });

    expect(refCalled).toBe(1);
  });

  // @gate !disableStringRefs
  it('coerces numbers to strings', async () => {
    class A extends React.Component {
      render() {
        return <div ref={1} />;
      }
    }
    let a;
    await expect(async () => {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);

      await act(() => {
        root.render(<A ref={current => (a = current)} />);
      });
    }).toErrorDev([
      'Warning: Component "A" contains the string ref "1". ' +
        'Support for string refs will be removed in a future major release. ' +
        'We recommend using useRef() or createRef() instead. ' +
        'Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref\n' +
        '    in A (at **)',
    ]);
    expect(a.refs[1].nodeName).toBe('DIV');
  });

  // @gate !disableStringRefs
  it('provides an error for invalid refs', async () => {
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await expect(async () => {
      await act(() => {
        root.render(<div ref={10} />);
      });
    }).rejects.toThrow(
      'Element ref was specified as a string (10) but no owner was set.',
    );
    await expect(async () => {
      await act(() => {
        root.render(<div ref={true} />);
      });
    }).rejects.toThrow(
      'Element ref was specified as a string (true) but no owner was set.',
    );
    await expect(async () => {
      await act(() => {
        root.render(<div ref={Symbol('foo')} />);
      });
    }).rejects.toThrow('Expected ref to be a function');
  });

  // @gate !enableRefAsProp
  it('undefined ref on manually inlined React element triggers error', async () => {
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await expect(async () => {
      await act(() => {
        root.render({
          $$typeof: Symbol.for('react.element'),
          type: 'div',
          props: {
            ref: undefined,
          },
          key: null,
        });
      });
    }).rejects.toThrow('Expected ref to be a function');
  });
});

describe('root level refs', () => {
  it('attaches and detaches root refs', async () => {
    let inst = null;

    // host node
    let ref = jest.fn(value => (inst = value));
    const container = document.createElement('div');
    let root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<div ref={ref} />);
    });
    let result = container.firstChild;
    expect(ref).toHaveBeenCalledTimes(1);
    expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLDivElement);
    expect(result).toBe(ref.mock.calls[0][0]);
    await act(() => {
      root.unmount();
    });
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
    root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<Comp ref={ref} />);
    });

    expect(ref).toHaveBeenCalledTimes(1);
    expect(inst).toBeInstanceOf(Comp);

    // ensure we have the correct instance
    expect(inst.method()).toBe(true);

    await act(() => {
      root.unmount();
    });
    expect(ref).toHaveBeenCalledTimes(2);
    expect(ref.mock.calls[1][0]).toBe(null);

    // fragment
    inst = null;
    ref = jest.fn(value => (inst = value));
    let divInst = null;
    const ref2 = jest.fn(value => (divInst = value));
    root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render([
        <Comp ref={ref} key="a" />,
        5,
        <div ref={ref2} key="b">
          Hello
        </div>,
      ]);
    });

    // first call should be `Comp`
    expect(ref).toHaveBeenCalledTimes(1);
    expect(ref.mock.calls[0][0]).toBeInstanceOf(Comp);

    expect(ref2).toHaveBeenCalledTimes(1);
    expect(divInst).toBeInstanceOf(HTMLDivElement);

    await act(() => {
      root.unmount();
    });
    expect(ref).toHaveBeenCalledTimes(2);
    expect(ref.mock.calls[1][0]).toBe(null);
    expect(ref2).toHaveBeenCalledTimes(2);
    expect(ref2.mock.calls[1][0]).toBe(null);

    // null
    root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(null);
    });
    result = container.firstChild;
    expect(result).toBe(null);

    // primitives
    await act(() => {
      root.render(5);
    });
    result = container.firstChild;
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

  // @gate !disableStringRefs
  it('throws an error', async () => {
    await expect(async function () {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);

      await act(() => {
        root.render(<RefTest />);
      });
    }).rejects.toThrowError(
      'Element ref was specified as a string (p) but no owner was set. This could happen for one of' +
        ' the following reasons:\n' +
        '1. You may be adding a ref to a function component\n' +
        "2. You may be adding a ref to a component that was not created inside a component's render method\n" +
        '3. You have multiple copies of React loaded\n' +
        'See https://reactjs.org/link/refs-must-have-owner for more information.',
    );
  });
});

describe('strings refs across renderers', () => {
  // @gate !disableStringRefs
  it('does not break', async () => {
    class Parent extends React.Component {
      render() {
        // This component owns both refs.
        return (
          <Indirection
            child1={<div ref="child1" />}
            child2={<div ref="child2" />}
          />
        );
      }
    }

    class Indirection extends React.Component {
      componentDidUpdate() {
        // One ref is being rendered later using another renderer copy.
        jest.resetModules();
        const AnotherCopyOfReactDOM = require('react-dom');
        const AnotherCopyOfReactDOMClient = require('react-dom/client');
        const root = AnotherCopyOfReactDOMClient.createRoot(div2);
        AnotherCopyOfReactDOM.flushSync(() => {
          root.render(this.props.child2);
        });
      }
      render() {
        // The other one is being rendered directly.
        return this.props.child1;
      }
    }

    const div1 = document.createElement('div');
    const div2 = document.createElement('div');

    const root = ReactDOMClient.createRoot(div1);
    let inst;
    await expect(async () => {
      await act(() => {
        root.render(
          <Parent
            ref={current => {
              if (current !== null) {
                inst = current;
              }
            }}
          />,
        );
      });
    }).toErrorDev([
      'Warning: Component "Indirection" contains the string ref "child1". ' +
        'Support for string refs will be removed in a future major release. ' +
        'We recommend using useRef() or createRef() instead. ' +
        'Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref\n' +
        '    in Indirection (at **)\n' +
        '    in Parent (at **)',
    ]);

    // Only the first ref has rendered yet.
    expect(inst.refs.child1.tagName).toBe('DIV');
    expect(inst.refs.child1).toBe(div1.firstChild);

    await expect(async () => {
      // Now both refs should be rendered.
      await act(() => {
        root.render(<Parent />);
      });
    }).toErrorDev(
      [
        'Warning: Component "Root" contains the string ref "child2". ' +
          'Support for string refs will be removed in a future major release. ' +
          'We recommend using useRef() or createRef() instead. ' +
          'Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref',
      ],
      {withoutStack: true},
    );
    expect(inst.refs.child1.tagName).toBe('DIV');
    expect(inst.refs.child1).toBe(div1.firstChild);
    expect(inst.refs.child2.tagName).toBe('DIV');
    expect(inst.refs.child2).toBe(div2.firstChild);
  });
});

describe('refs return clean up function', () => {
  it('calls clean up function if it exists', async () => {
    const container = document.createElement('div');
    let cleanUp = jest.fn();
    let setup = jest.fn();

    const root = ReactDOMClient.createRoot(container);

    await act(() => {
      root.render(
        <div
          ref={_ref => {
            setup(_ref);
            return cleanUp;
          }}
        />,
      );
    });

    await act(() => {
      root.render(
        <div
          ref={_ref => {
            setup(_ref);
          }}
        />,
      );
    });

    expect(setup).toHaveBeenCalledTimes(2);
    expect(cleanUp).toHaveBeenCalledTimes(1);
    expect(cleanUp.mock.calls[0][0]).toBe(undefined);

    await act(() => {
      root.render(<div ref={_ref => {}} />);
    });

    expect(cleanUp).toHaveBeenCalledTimes(1);
    expect(setup).toHaveBeenCalledTimes(3);
    expect(setup.mock.calls[2][0]).toBe(null);

    cleanUp = jest.fn();
    setup = jest.fn();

    await act(() => {
      root.render(
        <div
          ref={_ref => {
            setup(_ref);
            return cleanUp;
          }}
        />,
      );
    });

    expect(setup).toHaveBeenCalledTimes(1);
    expect(cleanUp).toHaveBeenCalledTimes(0);

    await act(() => {
      root.render(
        <div
          ref={_ref => {
            setup(_ref);
            return cleanUp;
          }}
        />,
      );
    });

    expect(setup).toHaveBeenCalledTimes(2);
    expect(cleanUp).toHaveBeenCalledTimes(1);
  });

  it('handles ref functions with stable identity', async () => {
    const container = document.createElement('div');
    const cleanUp = jest.fn();
    const setup = jest.fn();

    function _onRefChange(_ref) {
      setup(_ref);
      return cleanUp;
    }

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<div ref={_onRefChange} />);
    });

    expect(setup).toHaveBeenCalledTimes(1);
    expect(cleanUp).toHaveBeenCalledTimes(0);

    await act(() => {
      root.render(<div className="niceClassName" ref={_onRefChange} />);
    });

    expect(setup).toHaveBeenCalledTimes(1);
    expect(cleanUp).toHaveBeenCalledTimes(0);

    await act(() => {
      root.render(<div />);
    });

    expect(setup).toHaveBeenCalledTimes(1);
    expect(cleanUp).toHaveBeenCalledTimes(1);
  });

  it('warns if clean up function is returned when called with null', async () => {
    const container = document.createElement('div');
    const cleanUp = jest.fn();
    const setup = jest.fn();
    let returnCleanUp = false;

    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(
        <div
          ref={_ref => {
            setup(_ref);
            if (returnCleanUp) {
              return cleanUp;
            }
          }}
        />,
      );
    });

    expect(setup).toHaveBeenCalledTimes(1);
    expect(cleanUp).toHaveBeenCalledTimes(0);

    returnCleanUp = true;

    await expect(async () => {
      await act(() => {
        root.render(
          <div
            ref={_ref => {
              setup(_ref);
              if (returnCleanUp) {
                return cleanUp;
              }
            }}
          />,
        );
      });
    }).toErrorDev('Unexpected return value from a callback ref in div');
  });
});
