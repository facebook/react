/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {InspectedElementPayload} from 'react-devtools-shared/src/backend/types';
import type {DehydratedData} from 'react-devtools-shared/src/devtools/views/Components/types';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type Store from 'react-devtools-shared/src/devtools/store';

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
    dehydratedData: DehydratedData | null,
  ): Object | null {
    if (dehydratedData !== null) {
      return hydrate(
        dehydratedData.data,
        dehydratedData.cleaned,
        dehydratedData.unserializable,
      );
    } else {
      return null;
    }
  }

  async function read(
    id: number,
    path?: Array<string | number>,
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
      bridge.send('inspectElement', {id, path, rendererID});

      jest.runOnlyPendingTimers();
    });
  }

  beforeEach(() => {
    bridge = global.bridge;
    store = global.store;

    hydrate = require('react-devtools-shared/src/hydration').hydrate;
    meta = require('react-devtools-shared/src/hydration').meta;

    // Redirect all React/ReactDOM requires to the v15 UMD.
    // We use the UMD because Jest doesn't enable us to mock deep imports (e.g. "react/lib/Something").
    jest.mock('react', () => jest.requireActual('react-15/dist/react.js'));
    jest.mock('react-dom', () =>
      jest.requireActual('react-dom-15/dist/react-dom.js'),
    );

    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should inspect the currently selected element', async done => {
    const Example = () => null;

    act(() =>
      ReactDOM.render(<Example a={1} b="abc" />, document.createElement('div')),
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
        document.createElement('div'),
      ),
    );

    const id = ((store.getElementIDAtIndex(0): any): number);
    const inspectedElement = await read(id);

    expect(inspectedElement).toMatchSnapshot('1: Initial inspection');

    const {props} = inspectedElement.value;
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
    const Immutable = require('immutable');

    const Example = () => null;

    const div = document.createElement('div');
    const exampleFunction = () => {};
    const setShallow = new Set(['abc', 123]);
    const mapShallow = new Map([['name', 'Brian'], ['food', 'sushi']]);
    const setOfSets = new Set([new Set(['a', 'b', 'c']), new Set([1, 2, 3])]);
    const mapOfMaps = new Map([['first', mapShallow], ['second', mapShallow]]);
    const typedArray = Int8Array.from([100, -100, 0]);
    const immutableMap = Immutable.fromJS({
      a: [{hello: 'there'}, 'fixed', true],
      b: 123,
      c: {
        '1': 'xyz',
        xyz: 1,
      },
    });

    act(() =>
      ReactDOM.render(
        <Example
          array_buffer={typedArray.buffer}
          date={new Date()}
          fn={exampleFunction}
          html_element={div}
          immutable={immutableMap}
          map={mapShallow}
          map_of_maps={mapOfMaps}
          react_element={<span />}
          set={setShallow}
          set_of_sets={setOfSets}
          symbol={Symbol('symbol')}
          typed_array={typedArray}
        />,
        document.createElement('div'),
      ),
    );

    const id = ((store.getElementIDAtIndex(0): any): number);
    const inspectedElement = await read(id);

    expect(inspectedElement).toMatchSnapshot('1: Initial inspection');

    const {
      array_buffer,
      date,
      fn,
      html_element,
      immutable,
      map,
      map_of_maps,
      react_element,
      set,
      set_of_sets,
      symbol,
      typed_array,
    } = inspectedElement.value.props;

    expect(array_buffer[meta.size]).toBe(3);
    expect(array_buffer[meta.inspectable]).toBe(false);
    expect(array_buffer[meta.name]).toBe('ArrayBuffer');
    expect(array_buffer[meta.type]).toBe('array_buffer');

    expect(date[meta.inspectable]).toBe(false);
    expect(date[meta.type]).toBe('date');

    expect(fn[meta.inspectable]).toBe(false);
    expect(fn[meta.name]).toBe('exampleFunction');
    expect(fn[meta.type]).toBe('function');

    expect(html_element[meta.inspectable]).toBe(false);
    expect(html_element[meta.name]).toBe('DIV');
    expect(html_element[meta.type]).toBe('html_element');

    expect(immutable[meta.inspectable]).toBeUndefined(); // Complex type
    expect(immutable[meta.name]).toBe('Map');
    expect(immutable[meta.type]).toBe('iterator');

    expect(map[meta.inspectable]).toBeUndefined(); // Complex type
    expect(map[meta.name]).toBe('Map');
    expect(map[meta.type]).toBe('iterator');
    expect(map[0][meta.type]).toBe('array');

    expect(map_of_maps[meta.inspectable]).toBeUndefined(); // Complex type
    expect(map_of_maps[meta.name]).toBe('Map');
    expect(map_of_maps[meta.type]).toBe('iterator');
    expect(map_of_maps[0][meta.type]).toBe('array');

    expect(react_element[meta.inspectable]).toBe(false);
    expect(react_element[meta.name]).toBe('span');
    expect(react_element[meta.type]).toBe('react_element');

    expect(set[meta.inspectable]).toBeUndefined(); // Complex type
    expect(set[meta.name]).toBe('Set');
    expect(set[meta.type]).toBe('iterator');
    expect(set[0]).toBe('abc');
    expect(set[1]).toBe(123);

    expect(set_of_sets[meta.inspectable]).toBeUndefined(); // Complex type
    expect(set_of_sets[meta.name]).toBe('Set');
    expect(set_of_sets[meta.type]).toBe('iterator');
    expect(set_of_sets['0'][meta.inspectable]).toBe(true);

    expect(symbol[meta.inspectable]).toBe(false);
    expect(symbol[meta.name]).toBe('Symbol(symbol)');
    expect(symbol[meta.type]).toBe('symbol');

    expect(typed_array[meta.inspectable]).toBeUndefined(); // Complex type
    expect(typed_array[meta.size]).toBe(3);
    expect(typed_array[meta.name]).toBe('Int8Array');
    expect(typed_array[meta.type]).toBe('typed_array');
    expect(typed_array[0]).toBe(100);
    expect(typed_array[1]).toBe(-100);
    expect(typed_array[2]).toBe(0);

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
      'number',
    ): any): PropertyDescriptor<number>);
    descriptor.enumerable = true;
    Object.defineProperty(CustomData.prototype, 'number', descriptor);

    const Example = ({data}) => null;

    act(() =>
      ReactDOM.render(
        <Example data={new CustomData()} />,
        document.createElement('div'),
      ),
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
        document.createElement('div'),
      ),
    );

    const id = ((store.getElementIDAtIndex(0): any): number);

    let inspectedElement = await read(id);
    expect(inspectedElement).toMatchSnapshot('1: Initially inspect element');

    inspectedElement = await read(id, ['props', 'nestedObject', 'a']);
    expect(inspectedElement).toMatchSnapshot('2: Inspect props.nestedObject.a');

    inspectedElement = await read(id, ['props', 'nestedObject', 'a', 'b', 'c']);
    expect(inspectedElement).toMatchSnapshot(
      '3: Inspect props.nestedObject.a.b.c',
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
      '4: Inspect props.nestedObject.a.b.c.0.d',
    );

    done();
  });
});
