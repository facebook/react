/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOMClient;
let ReactDOMServer;
let ReactTestUtils;
let act;

function getTestDocument(markup) {
  const doc = document.implementation.createHTMLDocument('');
  doc.open();
  doc.write(
    markup ||
      '<!doctype html><html><meta charset=utf-8><title>test doc</title>',
  );
  doc.close();
  return doc;
}

describe('ReactTestUtils', () => {
  beforeEach(() => {
    React = require('react');
    ReactDOMClient = require('react-dom/client');
    ReactDOMServer = require('react-dom/server');
    ReactTestUtils = require('react-dom/test-utils');
    act = require('internal-test-utils').act;
  });

  // @gate !disableDOMTestUtils
  it('Simulate should have locally attached media events', () => {
    expect(Object.keys(ReactTestUtils.Simulate).sort()).toMatchInlineSnapshot(`
      [
        "abort",
        "animationEnd",
        "animationIteration",
        "animationStart",
        "auxClick",
        "beforeInput",
        "blur",
        "canPlay",
        "canPlayThrough",
        "cancel",
        "change",
        "click",
        "close",
        "compositionEnd",
        "compositionStart",
        "compositionUpdate",
        "contextMenu",
        "copy",
        "cut",
        "doubleClick",
        "drag",
        "dragEnd",
        "dragEnter",
        "dragExit",
        "dragLeave",
        "dragOver",
        "dragStart",
        "drop",
        "durationChange",
        "emptied",
        "encrypted",
        "ended",
        "error",
        "focus",
        "gotPointerCapture",
        "input",
        "invalid",
        "keyDown",
        "keyPress",
        "keyUp",
        "load",
        "loadStart",
        "loadedData",
        "loadedMetadata",
        "lostPointerCapture",
        "mouseDown",
        "mouseEnter",
        "mouseLeave",
        "mouseMove",
        "mouseOut",
        "mouseOver",
        "mouseUp",
        "paste",
        "pause",
        "play",
        "playing",
        "pointerCancel",
        "pointerDown",
        "pointerEnter",
        "pointerLeave",
        "pointerMove",
        "pointerOut",
        "pointerOver",
        "pointerUp",
        "progress",
        "rateChange",
        "reset",
        "resize",
        "scroll",
        "seeked",
        "seeking",
        "select",
        "stalled",
        "submit",
        "suspend",
        "timeUpdate",
        "toggle",
        "touchCancel",
        "touchEnd",
        "touchMove",
        "touchStart",
        "transitionEnd",
        "volumeChange",
        "waiting",
        "wheel",
      ]
    `);
  });

  // @gate !disableDOMTestUtils
  it('gives Jest mocks a passthrough implementation with mockComponent()', async () => {
    class MockedComponent extends React.Component {
      render() {
        throw new Error('Should not get here.');
      }
    }
    // This is close enough to what a Jest mock would give us.
    MockedComponent.prototype.render = jest.fn();

    // Patch it up so it returns its children.
    expect(() => ReactTestUtils.mockComponent(MockedComponent)).toWarnDev(
      'ReactTestUtils.mockComponent() is deprecated. ' +
        'Use shallow rendering or jest.mock() instead.\n\n' +
        'See https://react.dev/link/test-utils-mock-component for more information.',
      {withoutStack: true},
    );

    // De-duplication check
    ReactTestUtils.mockComponent(MockedComponent);

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(<MockedComponent>Hello</MockedComponent>);
    });

    expect(container.textContent).toBe('Hello');
  });

  // @gate !disableDOMTestUtils
  it('can scryRenderedComponentsWithType', async () => {
    class Child extends React.Component {
      render() {
        return null;
      }
    }
    class Wrapper extends React.Component {
      render() {
        return (
          <div>
            <Child />
          </div>
        );
      }
    }
    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    let renderedComponent;
    await act(() => {
      root.render(<Wrapper ref={current => (renderedComponent = current)} />);
    });
    const scryResults = ReactTestUtils.scryRenderedComponentsWithType(
      renderedComponent,
      Child,
    );
    expect(scryResults.length).toBe(1);
  });

  // @gate !disableDOMTestUtils
  it('can scryRenderedDOMComponentsWithClass with TextComponent', async () => {
    class Wrapper extends React.Component {
      render() {
        return (
          <div>
            Hello <span>Jim</span>
          </div>
        );
      }
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    let renderedComponent;
    await act(() => {
      root.render(<Wrapper ref={current => (renderedComponent = current)} />);
    });
    const scryResults = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      'NonExistentClass',
    );
    expect(scryResults.length).toBe(0);
  });

  // @gate !disableDOMTestUtils
  it('can scryRenderedDOMComponentsWithClass with className contains \\n', async () => {
    class Wrapper extends React.Component {
      render() {
        return (
          <div>
            Hello <span className={'x\ny'}>Jim</span>
          </div>
        );
      }
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    let renderedComponent;
    await act(() => {
      root.render(<Wrapper ref={current => (renderedComponent = current)} />);
    });
    const scryResults = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      'x',
    );
    expect(scryResults.length).toBe(1);
  });

  // @gate !disableDOMTestUtils
  it('can scryRenderedDOMComponentsWithClass with multiple classes', async () => {
    class Wrapper extends React.Component {
      render() {
        return (
          <div>
            Hello <span className={'x y z'}>Jim</span>
          </div>
        );
      }
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    let renderedComponent;
    await act(() => {
      root.render(<Wrapper ref={current => (renderedComponent = current)} />);
    });
    const scryResults1 = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      'x y',
    );
    expect(scryResults1.length).toBe(1);

    const scryResults2 = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      'x z',
    );
    expect(scryResults2.length).toBe(1);

    const scryResults3 = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      ['x', 'y'],
    );
    expect(scryResults3.length).toBe(1);

    expect(scryResults1[0]).toBe(scryResults2[0]);
    expect(scryResults1[0]).toBe(scryResults3[0]);

    const scryResults4 = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      ['x', 'a'],
    );
    expect(scryResults4.length).toBe(0);

    const scryResults5 = ReactTestUtils.scryRenderedDOMComponentsWithClass(
      renderedComponent,
      ['x a'],
    );
    expect(scryResults5.length).toBe(0);
  });

  // @gate !disableDOMTestUtils
  it('traverses children in the correct order', async () => {
    class Wrapper extends React.Component {
      render() {
        return <div>{this.props.children}</div>;
      }
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    await act(() => {
      root.render(
        <Wrapper>
          {null}
          <div>purple</div>
        </Wrapper>,
      );
    });
    let tree;
    await act(() => {
      root.render(
        <Wrapper ref={current => (tree = current)}>
          <div>orange</div>
          <div>purple</div>
        </Wrapper>,
      );
    });

    const log = [];
    ReactTestUtils.findAllInRenderedTree(tree, function (child) {
      if (ReactTestUtils.isDOMComponent(child)) {
        log.push(child.textContent);
      }
    });

    // Should be document order, not mount order (which would be purple, orange)
    expect(log).toEqual(['orangepurple', 'orange', 'purple']);
  });

  // @gate !disableDOMTestUtils
  it('should support injected wrapper components as DOM components', async () => {
    const injectedDOMComponents = [
      'button',
      'form',
      'iframe',
      'img',
      'input',
      'option',
      'select',
      'textarea',
    ];

    // eslint-disable-next-line no-for-of-loops/no-for-of-loops
    for (const type of injectedDOMComponents) {
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      let testComponent;
      await act(() => {
        root.render(
          React.createElement(type, {
            ref: current => (testComponent = current),
          }),
        );
      });

      expect(testComponent.tagName).toBe(type.toUpperCase());
      expect(ReactTestUtils.isDOMComponent(testComponent)).toBe(true);
    }

    // Full-page components (html, head, body) can't be rendered into a div
    // directly...
    class Root extends React.Component {
      htmlRef = React.createRef();
      headRef = React.createRef();
      bodyRef = React.createRef();

      render() {
        return (
          <html ref={this.htmlRef}>
            <head ref={this.headRef}>
              <title>hello</title>
            </head>
            <body ref={this.bodyRef}>hello, world</body>
          </html>
        );
      }
    }

    const markup = ReactDOMServer.renderToString(<Root />);
    const testDocument = getTestDocument(markup);
    let component;
    await act(() => {
      ReactDOMClient.hydrateRoot(
        testDocument,
        <Root ref={current => (component = current)} />,
      );
    });

    expect(component.htmlRef.current.tagName).toBe('HTML');
    expect(component.headRef.current.tagName).toBe('HEAD');
    expect(component.bodyRef.current.tagName).toBe('BODY');
    expect(ReactTestUtils.isDOMComponent(component.htmlRef.current)).toBe(true);
    expect(ReactTestUtils.isDOMComponent(component.headRef.current)).toBe(true);
    expect(ReactTestUtils.isDOMComponent(component.bodyRef.current)).toBe(true);
  });

  // @gate !disableDOMTestUtils
  it('can scry with stateless components involved', async () => {
    const Function = () => (
      <div>
        <hr />
      </div>
    );

    class SomeComponent extends React.Component {
      render() {
        return (
          <div>
            <Function />
            <hr />
          </div>
        );
      }
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    let inst;
    await act(() => {
      root.render(<SomeComponent ref={current => (inst = current)} />);
    });

    const hrs = ReactTestUtils.scryRenderedDOMComponentsWithTag(inst, 'hr');
    expect(hrs.length).toBe(2);
  });

  // @gate !disableDOMTestUtils
  it('provides a clear error when passing invalid objects to scry', () => {
    // This is probably too relaxed but it's existing behavior.
    ReactTestUtils.findAllInRenderedTree(null, 'span');
    ReactTestUtils.findAllInRenderedTree(undefined, 'span');
    ReactTestUtils.findAllInRenderedTree('', 'span');
    ReactTestUtils.findAllInRenderedTree(0, 'span');
    ReactTestUtils.findAllInRenderedTree(false, 'span');

    expect(() => {
      ReactTestUtils.findAllInRenderedTree([], 'span');
    }).toThrow(
      'The first argument must be a React class instance. ' +
        'Instead received: an array.',
    );
    expect(() => {
      ReactTestUtils.scryRenderedDOMComponentsWithClass(10, 'button');
    }).toThrow(
      'The first argument must be a React class instance. ' +
        'Instead received: 10.',
    );
    expect(() => {
      ReactTestUtils.findRenderedDOMComponentWithClass('hello', 'button');
    }).toThrow(
      'The first argument must be a React class instance. ' +
        'Instead received: hello.',
    );
    expect(() => {
      ReactTestUtils.scryRenderedDOMComponentsWithTag(
        {x: true, y: false},
        'span',
      );
    }).toThrow(
      'The first argument must be a React class instance. ' +
        'Instead received: object with keys {x, y}.',
    );
    const div = document.createElement('div');
    expect(() => {
      ReactTestUtils.findRenderedDOMComponentWithTag(div, 'span');
    }).toThrow(
      'The first argument must be a React class instance. ' +
        'Instead received: a DOM node.',
    );
    expect(() => {
      ReactTestUtils.scryRenderedComponentsWithType(true, 'span');
    }).toThrow(
      'The first argument must be a React class instance. ' +
        'Instead received: true.',
    );
    expect(() => {
      ReactTestUtils.findRenderedComponentWithType(true, 'span');
    }).toThrow(
      'The first argument must be a React class instance. ' +
        'Instead received: true.',
    );
  });

  describe('Simulate', () => {
    // @gate !disableDOMTestUtils
    it('should change the value of an input field', async () => {
      const obj = {
        handler: function (e) {
          e.persist();
        },
      };
      spyOnDevAndProd(obj, 'handler');
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(<input type="text" onChange={obj.handler} />);
      });
      const node = container.firstChild;

      node.value = 'giraffe';
      ReactTestUtils.Simulate.change(node);

      expect(obj.handler).toHaveBeenCalledWith(
        expect.objectContaining({target: node}),
      );
    });

    // @gate !disableDOMTestUtils
    it('should change the value of an input field in a component', async () => {
      class SomeComponent extends React.Component {
        inputRef = React.createRef();
        render() {
          return (
            <div>
              <input
                type="text"
                ref={this.inputRef}
                onChange={this.props.handleChange}
              />
            </div>
          );
        }
      }

      const obj = {
        handler: function (e) {
          e.persist();
        },
      };
      spyOnDevAndProd(obj, 'handler');
      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      let instance;
      await act(() => {
        root.render(
          <SomeComponent
            handleChange={obj.handler}
            ref={current => (instance = current)}
          />,
        );
      });

      const node = instance.inputRef.current;
      node.value = 'zebra';
      ReactTestUtils.Simulate.change(node);

      expect(obj.handler).toHaveBeenCalledWith(
        expect.objectContaining({target: node}),
      );
    });

    // @gate !disableDOMTestUtils
    it('should not warn when used with extra properties', async () => {
      const CLIENT_X = 100;

      class Component extends React.Component {
        childRef = React.createRef();
        handleClick = e => {
          expect(e.clientX).toBe(CLIENT_X);
        };

        render() {
          return <div onClick={this.handleClick} ref={this.childRef} />;
        }
      }

      const element = document.createElement('div');
      const root = ReactDOMClient.createRoot(element);
      let instance;
      await act(() => {
        root.render(<Component ref={current => (instance = current)} />);
      });

      ReactTestUtils.Simulate.click(instance.childRef.current, {
        clientX: CLIENT_X,
      });
    });

    // @gate !disableDOMTestUtils
    it('should set the type of the event', async () => {
      let event;
      const stub = jest.fn().mockImplementation(e => {
        e.persist();
        event = e;
      });

      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      let node;
      await act(() => {
        root.render(<div onKeyDown={stub} ref={current => (node = current)} />);
      });

      ReactTestUtils.Simulate.keyDown(node);

      expect(event.type).toBe('keydown');
      expect(event.nativeEvent.type).toBe('keydown');
    });

    // @gate !disableDOMTestUtils
    it('should work with renderIntoDocument', async () => {
      const onChange = jest.fn();

      class MyComponent extends React.Component {
        render() {
          return (
            <div>
              <input type="text" onChange={onChange} />
            </div>
          );
        }
      }

      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      let instance;
      await act(() => {
        root.render(<MyComponent ref={current => (instance = current)} />);
      });

      const input = ReactTestUtils.findRenderedDOMComponentWithTag(
        instance,
        'input',
      );
      input.value = 'giraffe';
      ReactTestUtils.Simulate.change(input);

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({target: input}),
      );
    });

    // @gate !disableDOMTestUtils
    it('should have mouse enter simulated by test utils', async () => {
      const idCallOrder = [];
      const recordID = function (id) {
        idCallOrder.push(id);
      };
      let CHILD;
      function Child(props) {
        return (
          <div
            ref={current => (CHILD = current)}
            onMouseEnter={() => {
              recordID(CHILD);
            }}
          />
        );
      }

      class ChildWrapper extends React.PureComponent {
        render() {
          return <Child />;
        }
      }

      const container = document.createElement('div');
      const root = ReactDOMClient.createRoot(container);
      await act(() => {
        root.render(
          <div>
            <div>
              <ChildWrapper />
              <button disabled={true} />
            </div>
          </div>,
        );
      });
      await act(() => {
        ReactTestUtils.Simulate.mouseEnter(CHILD);
      });
      expect(idCallOrder).toEqual([CHILD]);
    });
  });

  // @gate !disableDOMTestUtils
  // @gate !disableLegacyMode
  it('should call setState callback with no arguments', async () => {
    let mockArgs;
    class Component extends React.Component {
      componentDidMount() {
        this.setState({}, (...args) => (mockArgs = args));
      }
      render() {
        return false;
      }
    }

    ReactTestUtils.renderIntoDocument(<Component />);

    expect(mockArgs.length).toEqual(0);
  });

  // @gate !disableDOMTestUtils
  it('should find rendered component with type in document', async () => {
    class MyComponent extends React.Component {
      render() {
        return true;
      }
    }

    const container = document.createElement('div');
    const root = ReactDOMClient.createRoot(container);
    let instance;
    await act(() => {
      root.render(<MyComponent ref={current => (instance = current)} />);
    });

    const renderedComponentType = ReactTestUtils.findRenderedComponentWithType(
      instance,
      MyComponent,
    );

    expect(renderedComponentType).toBe(instance);
  });

  // @gate __DEV__
  it('warns when using `act`', () => {
    expect(() => {
      ReactTestUtils.act(() => {});
    }).toErrorDev(
      [
        '`ReactDOMTestUtils.act` is deprecated in favor of `React.act`. ' +
          'Import `act` from `react` instead of `react-dom/test-utils`. ' +
          'See https://react.dev/warnings/react-dom-test-utils for more info.',
      ],
      {withoutStack: true},
    );
  });
});
