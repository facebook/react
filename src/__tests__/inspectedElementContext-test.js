// @flow

import typeof ReactTestRenderer from 'react-test-renderer';
import type { GetPath } from 'src/devtools/views/Components/InspectedElementContext';
import type Bridge from 'src/bridge';
import type Store from 'src/devtools/store';

describe('InspectedElementContext', () => {
  let React;
  let ReactDOM;
  let TestRenderer: ReactTestRenderer;
  let bridge: Bridge;
  let store: Store;
  let meta;
  let utils;

  let BridgeContext;
  let InspectedElementContext;
  let InspectedElementContextController;
  let StoreContext;
  let TestUtils;
  let TreeContextController;

  beforeEach(() => {
    utils = require('./utils');
    utils.beforeEachProfiling();

    meta = require('src/hydration').meta;

    bridge = global.bridge;
    store = global.store;
    store.collapseNodesByDefault = false;

    React = require('react');
    ReactDOM = require('react-dom');
    TestUtils = require('react-dom/test-utils');
    TestRenderer = utils.requireTestRenderer();

    BridgeContext = require('src/devtools/views/context').BridgeContext;
    InspectedElementContext = require('src/devtools/views/Components/InspectedElementContext')
      .InspectedElementContext;
    InspectedElementContextController = require('src/devtools/views/Components/InspectedElementContext')
      .InspectedElementContextController;
    StoreContext = require('src/devtools/views/context').StoreContext;
    TreeContextController = require('src/devtools/views/Components/TreeContext')
      .TreeContextController;
  });

  const Contexts = ({
    children,
    defaultSelectedElementID = null,
    defaultSelectedElementIndex = null,
  }) => (
    <BridgeContext.Provider value={bridge}>
      <StoreContext.Provider value={store}>
        <TreeContextController
          defaultSelectedElementID={defaultSelectedElementID}
          defaultSelectedElementIndex={defaultSelectedElementIndex}
        >
          <InspectedElementContextController>
            {children}
          </InspectedElementContextController>
        </TreeContextController>
      </StoreContext.Provider>
    </BridgeContext.Provider>
  );

  it('should inspect the currently selected element', async done => {
    const Example = () => {
      const [count] = React.useState(1);
      return count;
    };

    const container = document.createElement('div');
    await utils.actAsync(() =>
      ReactDOM.render(<Example a={1} b="abc" />, container)
    );

    const id = ((store.getElementIDAtIndex(0): any): number);

    let didFinish = false;

    function Suspender({ target }) {
      const { read } = React.useContext(InspectedElementContext);
      const inspectedElement = read(id);
      expect(inspectedElement).toMatchSnapshot(`1: Inspected element ${id}`);
      didFinish = true;
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={0}
          >
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>
        ),
      false
    );
    expect(didFinish).toBe(true);

    done();
  });

  it('should poll for updates for the currently selected element', async done => {
    const Example = () => null;

    const container = document.createElement('div');
    await utils.actAsync(
      () => ReactDOM.render(<Example a={1} b="abc" />, container),
      false
    );

    const id = ((store.getElementIDAtIndex(0): any): number);

    let inspectedElement = null;

    function Suspender({ target }) {
      const { read } = React.useContext(InspectedElementContext);
      inspectedElement = read(id);
      return null;
    }

    let renderer;

    await utils.actAsync(() => {
      renderer = TestRenderer.create(
        <Contexts defaultSelectedElementID={id} defaultSelectedElementIndex={0}>
          <React.Suspense fallback={null}>
            <Suspender target={id} />
          </React.Suspense>
        </Contexts>
      );
    }, false);
    expect(inspectedElement).toMatchSnapshot('1: initial render');

    await utils.actAsync(
      () => ReactDOM.render(<Example a={2} b="def" />, container),
      false
    );

    inspectedElement = null;
    await utils.actAsync(
      () =>
        renderer.update(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={0}
          >
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>
        ),
      false
    );
    expect(inspectedElement).toMatchSnapshot('2: updated state');

    done();
  });

  it('should not re-render a function with hooks if it did not update since it was last inspected', async done => {
    let targetRenderCount = 0;

    const Wrapper = ({ children }) => children;
    const Target = React.memo(props => {
      targetRenderCount++;
      React.useState(0);
      return null;
    });

    const container = document.createElement('div');
    await utils.actAsync(() =>
      ReactDOM.render(
        <Wrapper>
          <Target a={1} b="abc" />
        </Wrapper>,
        container
      )
    );

    const id = ((store.getElementIDAtIndex(1): any): number);

    let inspectedElement = null;

    function Suspender({ target }) {
      const { read } = React.useContext(InspectedElementContext);
      inspectedElement = read(target);
      return null;
    }

    targetRenderCount = 0;

    let renderer;
    await utils.actAsync(
      () =>
        (renderer = TestRenderer.create(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={1}
          >
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>
        )),
      false
    );
    expect(targetRenderCount).toBe(1);
    expect(inspectedElement).toMatchSnapshot('1: initial render');

    const initialInspectedElement = inspectedElement;

    targetRenderCount = 0;
    inspectedElement = null;
    await utils.actAsync(
      () =>
        renderer.update(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={1}
          >
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>
        ),
      false
    );
    expect(targetRenderCount).toBe(0);
    expect(inspectedElement).toEqual(initialInspectedElement);

    targetRenderCount = 0;

    await utils.actAsync(
      () =>
        ReactDOM.render(
          <Wrapper>
            <Target a={2} b="def" />
          </Wrapper>,
          container
        ),
      false
    );

    // Target should have been rendered once (by ReactDOM) and once by DevTools for inspection.
    expect(targetRenderCount).toBe(2);
    expect(inspectedElement).toMatchSnapshot('2: updated state');

    done();
  });

  it('should support complex data types', async done => {
    const Example = () => null;

    const div = document.createElement('div');
    const exmapleFunction = () => {};
    const typedArray = new Uint8Array(3);

    const container = document.createElement('div');
    await utils.actAsync(() =>
      ReactDOM.render(
        <Example
          html_element={div}
          fn={exmapleFunction}
          symbol={Symbol('symbol')}
          react_element={<span />}
          array_buffer={typedArray.buffer}
          typed_array={typedArray}
          date={new Date()}
        />,
        container
      )
    );

    const id = ((store.getElementIDAtIndex(0): any): number);

    let inspectedElement = null;

    function Suspender({ target }) {
      const { read } = React.useContext(InspectedElementContext);
      inspectedElement = read(id);
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={0}
          >
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>
        ),
      false
    );

    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot(`1: Inspected element ${id}`);

    const {
      html_element,
      fn,
      symbol,
      react_element,
      array_buffer,
      typed_array,
      date,
    } = (inspectedElement: any).props;
    expect(html_element[meta.name]).toBe('DIV');
    expect(html_element[meta.type]).toBe('html_element');
    expect(fn[meta.name]).toBe('exmapleFunction');
    expect(fn[meta.type]).toBe('function');
    expect(symbol[meta.name]).toBe('Symbol(symbol)');
    expect(symbol[meta.type]).toBe('symbol');
    expect(react_element[meta.name]).toBe('span');
    expect(react_element[meta.type]).toBe('react_element');
    expect(array_buffer[meta.meta].length).toBe(3);
    expect(array_buffer[meta.name]).toBe('ArrayBuffer');
    expect(array_buffer[meta.type]).toBe('array_buffer');
    expect(typed_array[meta.meta].length).toBe(3);
    expect(typed_array[meta.name]).toBe('Uint8Array');
    expect(typed_array[meta.type]).toBe('typed_array');
    expect(date[meta.type]).toBe('date');

    done();
  });

  it('should support custom objects with enumerable properties and getters', async done => {
    class CustomData {
      _number = 42;
      get number() {
        return this._number;
      }
      set number(value) {
        this._number = value;
      }
    }

    const descriptor = ((Object.getOwnPropertyDescriptor(
      CustomData.prototype,
      'number'
    ): any): PropertyDescriptor<number>);
    descriptor.enumerable = true;
    Object.defineProperty(CustomData.prototype, 'number', descriptor);

    const Example = () => null;

    const container = document.createElement('div');
    await utils.actAsync(() =>
      ReactDOM.render(<Example data={new CustomData()} />, container)
    );

    const id = ((store.getElementIDAtIndex(0): any): number);

    let didFinish = false;

    function Suspender({ target }) {
      const { read } = React.useContext(InspectedElementContext);
      const inspectedElement = read(id);
      expect(inspectedElement).toMatchSnapshot(`1: Inspected element ${id}`);
      didFinish = true;
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={0}
          >
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>
        ),
      false
    );
    expect(didFinish).toBe(true);

    done();
  });

  it('should not dehydrate nested values until explicitly requested', async done => {
    const Example = () => null;

    const container = document.createElement('div');
    await utils.actAsync(() =>
      ReactDOM.render(
        <Example
          nestedObject={{
            a: {
              b: {
                c: [
                  {
                    d: {
                      e: {},
                    },
                  },
                ],
              },
            },
          }}
        />,
        container
      )
    );

    const id = ((store.getElementIDAtIndex(0): any): number);

    let getPath: GetPath = ((null: any): GetPath);
    let inspectedElement = null;

    function Suspender({ target }) {
      const context = React.useContext(InspectedElementContext);
      getPath = context.getPath;
      inspectedElement = context.read(target);
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={0}
          >
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>
        ),
      false
    );
    expect(getPath).not.toBeNull();
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('1: Initially inspect element');

    inspectedElement = null;
    TestUtils.act(() => {
      getPath(id, ['props', 'nestedObject', 'a']);
      jest.runOnlyPendingTimers();
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('2: Inspect props.nestedObject.a');

    inspectedElement = null;
    TestUtils.act(() => {
      getPath(id, ['props', 'nestedObject', 'a', 'b', 'c']);
      jest.runOnlyPendingTimers();
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot(
      '3: Inspect props.nestedObject.a.b.c'
    );

    inspectedElement = null;
    TestUtils.act(() => {
      getPath(id, ['props', 'nestedObject', 'a', 'b', 'c', 0, 'd']);
      jest.runOnlyPendingTimers();
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot(
      '4: Inspect props.nestedObject.a.b.c.0.d'
    );

    done();
  });

  it('should include updates for nested values that were previously hydrated', async done => {
    const Example = () => null;

    const container = document.createElement('div');
    await utils.actAsync(() =>
      ReactDOM.render(
        <Example
          nestedObject={{
            a: {
              value: 1,
              b: {
                value: 1,
              },
            },
            c: {
              value: 1,
              d: {
                value: 1,
                e: {
                  value: 1,
                },
              },
            },
          }}
        />,
        container
      )
    );

    const id = ((store.getElementIDAtIndex(0): any): number);

    let getPath: GetPath = ((null: any): GetPath);
    let inspectedElement = null;

    function Suspender({ target }) {
      const context = React.useContext(InspectedElementContext);
      getPath = context.getPath;
      inspectedElement = context.read(id);
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={0}
          >
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>
        ),
      false
    );
    expect(getPath).not.toBeNull();
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('1: Initially inspect element');

    inspectedElement = null;
    TestUtils.act(() => {
      getPath(id, ['props', 'nestedObject', 'a']);
      jest.runOnlyPendingTimers();
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('2: Inspect props.nestedObject.a');

    inspectedElement = null;
    TestUtils.act(() => {
      getPath(id, ['props', 'nestedObject', 'c']);
      jest.runOnlyPendingTimers();
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('3: Inspect props.nestedObject.c');

    TestUtils.act(() => {
      ReactDOM.render(
        <Example
          nestedObject={{
            a: {
              value: 2,
              b: {
                value: 2,
              },
            },
            c: {
              value: 2,
              d: {
                value: 2,
                e: {
                  value: 2,
                },
              },
            },
          }}
        />,
        container
      );
    });

    TestUtils.act(() => {
      inspectedElement = null;
      jest.runOnlyPendingTimers();
      expect(inspectedElement).not.toBeNull();
      expect(inspectedElement).toMatchSnapshot('4: update inspected element');
    });

    done();
  });

  it('should not tear if hydration is requested after an update', async done => {
    const Example = () => null;

    const container = document.createElement('div');
    await utils.actAsync(() =>
      ReactDOM.render(
        <Example
          nestedObject={{
            a: {
              value: 1,
              b: {
                value: 1,
              },
            },
          }}
        />,
        container
      )
    );

    const id = ((store.getElementIDAtIndex(0): any): number);

    let getPath: GetPath = ((null: any): GetPath);
    let inspectedElement = null;

    function Suspender({ target }) {
      const context = React.useContext(InspectedElementContext);
      getPath = context.getPath;
      inspectedElement = context.read(id);
      return null;
    }

    await utils.actAsync(
      () =>
        TestRenderer.create(
          <Contexts
            defaultSelectedElementID={id}
            defaultSelectedElementIndex={0}
          >
            <React.Suspense fallback={null}>
              <Suspender target={id} />
            </React.Suspense>
          </Contexts>
        ),
      false
    );
    expect(getPath).not.toBeNull();
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('1: Initially inspect element');

    TestUtils.act(() => {
      ReactDOM.render(
        <Example
          nestedObject={{
            a: {
              value: 2,
              b: {
                value: 2,
              },
            },
          }}
        />,
        container
      );
    });

    inspectedElement = null;
    TestUtils.act(() => {
      getPath(id, ['props', 'nestedObject', 'a']);
      jest.runOnlyPendingTimers();
    });
    expect(inspectedElement).not.toBeNull();
    expect(inspectedElement).toMatchSnapshot('2: Inspect props.nestedObject.a');

    done();
  });
});
