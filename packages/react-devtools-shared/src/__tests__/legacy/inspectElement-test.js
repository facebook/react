// @flow

import type { InspectedElementPayload } from 'src/backend/types';
import type { DehydratedData } from 'src/devtools/views/Components/types';
import type { FrontendBridge } from 'src/bridge';
import type Store from 'src/devtools/store';

describe('InspectedElementContext', () => {
  let React;
  let ReactDOM;
  let hydrate;
  let meta;
  let bridge: FrontendBridge;
  let store: Store;

  const act = (callback: Function) => {
    callback();

    jest.runAllTimers(); // Flush Bridge operations
  };

  function dehydrateHelper(
    dehydratedData: DehydratedData | null
  ): Object | null {
    if (dehydratedData !== null) {
      return hydrate(dehydratedData.data, dehydratedData.cleaned);
    } else {
      return null;
    }
  }

  async function read(
    id: number,
    path?: Array<string | number>
  ): Promise<Object> {
    return new Promise((resolve, reject) => {
      const rendererID = ((store.getRendererIDForElement(id): any): number);

      const onInspectedElement = (payload: InspectedElementPayload) => {
        bridge.removeListener('inspectedElement', onInspectedElement);

        if (payload.type === 'full-data' && payload.value !== null) {
          payload.value.context = dehydrateHelper(payload.value.context);
          payload.value.props = dehydrateHelper(payload.value.props);
          payload.value.state = dehydrateHelper(payload.value.state);
        }

        resolve(payload);
      };

      bridge.addListener('inspectedElement', onInspectedElement);
      bridge.send('inspectElement', { id, path, rendererID });

      jest.runOnlyPendingTimers();
    });
  }

  beforeEach(() => {
    bridge = global.bridge;
    store = global.store;

    hydrate = require('src/hydration').hydrate;
    meta = require('src/hydration').meta;

    // Redirect all React/ReactDOM requires to the v15 UMD.
    // We use the UMD because Jest doesn't enable us to mock deep imports (e.g. "react/lib/Something").
    jest.mock('react', () => jest.requireActual('react-15/dist/react.js'));
    jest.mock('react-dom', () =>
      jest.requireActual('react-dom-15/dist/react-dom.js')
    );

    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should inspect the currently selected element', async done => {
    const Example = () => null;

    act(() =>
      ReactDOM.render(<Example a={1} b="abc" />, document.createElement('div'))
    );

    const id = ((store.getElementIDAtIndex(0): any): number);
    const inspectedElement = await read(id);

    expect(inspectedElement).toMatchSnapshot('1: Initial inspection');

    done();
  });

  it('should support simple data types', async done => {
    const Example = () => null;

    act(() =>
      ReactDOM.render(
        <Example
          boolean_false={false}
          boolean_true={true}
          infinity={Infinity}
          integer_zero={0}
          integer_one={1}
          float={1.23}
          string="abc"
          string_empty=""
          nan={NaN}
          value_null={null}
          value_undefined={undefined}
        />,
        document.createElement('div')
      )
    );

    const id = ((store.getElementIDAtIndex(0): any): number);
    const inspectedElement = await read(id);

    expect(inspectedElement).toMatchSnapshot('1: Initial inspection');

    const { props } = inspectedElement.value;
    expect(props.boolean_false).toBe(false);
    expect(props.boolean_true).toBe(true);
    expect(Number.isFinite(props.infinity)).toBe(false);
    expect(props.integer_zero).toEqual(0);
    expect(props.integer_one).toEqual(1);
    expect(props.float).toEqual(1.23);
    expect(props.string).toEqual('abc');
    expect(props.string_empty).toEqual('');
    expect(props.nan).toBeNaN();
    expect(props.value_null).toBeNull();
    expect(props.value_undefined).toBeUndefined();

    done();
  });

  it('should support complex data types', async done => {
    const Example = () => null;

    const div = document.createElement('div');
    const exmapleFunction = () => {};
    const typedArray = new Uint8Array(3);

    act(() =>
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
        document.createElement('div')
      )
    );

    const id = ((store.getElementIDAtIndex(0): any): number);
    const inspectedElement = await read(id);

    expect(inspectedElement).toMatchSnapshot('1: Initial inspection');

    const {
      html_element,
      fn,
      symbol,
      react_element,
      array_buffer,
      typed_array,
      date,
    } = inspectedElement.value.props;
    expect(html_element[meta.inspectable]).toBe(false);
    expect(html_element[meta.name]).toBe('DIV');
    expect(html_element[meta.type]).toBe('html_element');
    expect(fn[meta.inspectable]).toBe(false);
    expect(fn[meta.name]).toBe('exmapleFunction');
    expect(fn[meta.type]).toBe('function');
    expect(symbol[meta.inspectable]).toBe(false);
    expect(symbol[meta.name]).toBe('Symbol(symbol)');
    expect(symbol[meta.type]).toBe('symbol');
    expect(react_element[meta.inspectable]).toBe(false);
    expect(react_element[meta.name]).toBe('span');
    expect(react_element[meta.type]).toBe('react_element');
    expect(array_buffer[meta.size]).toBe(3);
    expect(array_buffer[meta.inspectable]).toBe(false);
    expect(array_buffer[meta.name]).toBe('ArrayBuffer');
    expect(array_buffer[meta.type]).toBe('array_buffer');
    expect(typed_array[meta.size]).toBe(3);
    expect(typed_array[meta.inspectable]).toBe(false);
    expect(typed_array[meta.name]).toBe('Uint8Array');
    expect(typed_array[meta.type]).toBe('typed_array');
    expect(date[meta.inspectable]).toBe(false);
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

    const Example = ({ data }) => null;

    act(() =>
      ReactDOM.render(
        <Example data={new CustomData()} />,
        document.createElement('div')
      )
    );

    const id = ((store.getElementIDAtIndex(0): any): number);
    const inspectedElement = await read(id);

    expect(inspectedElement).toMatchSnapshot('1: Initial inspection');

    done();
  });

  it('should not dehydrate nested values until explicitly requested', async done => {
    const Example = () => null;

    act(() =>
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
        document.createElement('div')
      )
    );

    const id = ((store.getElementIDAtIndex(0): any): number);

    let inspectedElement = await read(id);
    expect(inspectedElement).toMatchSnapshot('1: Initially inspect element');

    inspectedElement = await read(id, ['props', 'nestedObject', 'a']);
    expect(inspectedElement).toMatchSnapshot('2: Inspect props.nestedObject.a');

    inspectedElement = await read(id, ['props', 'nestedObject', 'a', 'b', 'c']);
    expect(inspectedElement).toMatchSnapshot(
      '3: Inspect props.nestedObject.a.b.c'
    );

    inspectedElement = await read(id, [
      'props',
      'nestedObject',
      'a',
      'b',
      'c',
      0,
      'd',
    ]);
    expect(inspectedElement).toMatchSnapshot(
      '4: Inspect props.nestedObject.a.b.c.0.d'
    );

    done();
  });
});
