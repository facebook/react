/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type Store from 'react-devtools-shared/src/devtools/store';

describe('InspectedElementContext', () => {
  let React;
  let ReactDOM;
  let bridge: FrontendBridge;
  let store: Store;

  let backendAPI;

  const act = (callback: Function) => {
    callback();

    jest.runAllTimers(); // Flush Bridge operations
  };

  async function read(
    id: number,
    path?: Array<string | number> = null,
  ): Promise<Object> {
    const rendererID = ((store.getRendererIDForElement(id): any): number);
    const promise = backendAPI
      .inspectElement({
        bridge,
        id,
        path,
        rendererID,
      })
      .then(data =>
        backendAPI.convertInspectedElementBackendToFrontend(data.value),
      );

    jest.runOnlyPendingTimers();

    return promise;
  }

  beforeEach(() => {
    bridge = global.bridge;
    store = global.store;

    backendAPI = require('react-devtools-shared/src/backendAPI');

    // Redirect all React/ReactDOM requires to the v15 UMD.
    // We use the UMD because Jest doesn't enable us to mock deep imports (e.g. "react/lib/Something").
    jest.mock('react', () => jest.requireActual('react-15/dist/react.js'));
    jest.mock('react-dom', () =>
      jest.requireActual('react-dom-15/dist/react-dom.js'),
    );

    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should inspect the currently selected element', async () => {
    const Example = () => null;

    act(() =>
      ReactDOM.render(<Example a={1} b="abc" />, document.createElement('div')),
    );

    const id = ((store.getElementIDAtIndex(0): any): number);
    const inspectedElement = await read(id);

    expect(inspectedElement).toMatchInlineSnapshot(`
      Object {
        "context": Object {},
        "events": undefined,
        "hooks": null,
        "id": 2,
        "owners": null,
        "props": Object {
          "a": 1,
          "b": "abc",
        },
        "state": null,
      }
    `);
  });

  it('should support simple data types', async () => {
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

    expect(inspectedElement).toMatchInlineSnapshot(`
      Object {
        "context": Object {},
        "events": undefined,
        "hooks": null,
        "id": 2,
        "owners": null,
        "props": Object {
          "boolean_false": false,
          "boolean_true": true,
          "float": 1.23,
          "infinity": Infinity,
          "integer_one": 1,
          "integer_zero": 0,
          "nan": NaN,
          "string": "abc",
          "string_empty": "",
          "value_null": null,
          "value_undefined": undefined,
        },
        "state": null,
      }
    `);
  });

  it('should support complex data types', async () => {
    const Immutable = require('immutable');

    const Example = () => null;

    const arrayOfArrays = [[['abc', 123, true], []]];
    const div = document.createElement('div');
    const exampleFunction = () => {};
    const setShallow = new Set(['abc', 123]);
    const mapShallow = new Map([
      ['name', 'Brian'],
      ['food', 'sushi'],
    ]);
    const setOfSets = new Set([new Set(['a', 'b', 'c']), new Set([1, 2, 3])]);
    const mapOfMaps = new Map([
      ['first', mapShallow],
      ['second', mapShallow],
    ]);
    const objectOfObjects = {
      inner: {string: 'abc', number: 123, boolean: true},
    };
    const typedArray = Int8Array.from([100, -100, 0]);
    const arrayBuffer = typedArray.buffer;
    const dataView = new DataView(arrayBuffer);
    const immutableMap = Immutable.fromJS({
      a: [{hello: 'there'}, 'fixed', true],
      b: 123,
      c: {
        '1': 'xyz',
        xyz: 1,
      },
    });

    class Class {
      anonymousFunction = () => {};
    }
    const instance = new Class();

    act(() =>
      ReactDOM.render(
        <Example
          anonymous_fn={instance.anonymousFunction}
          array_buffer={arrayBuffer}
          array_of_arrays={arrayOfArrays}
          // eslint-disable-next-line no-undef
          big_int={BigInt(123)}
          bound_fn={exampleFunction.bind(this)}
          data_view={dataView}
          date={new Date(123)}
          fn={exampleFunction}
          html_element={div}
          immutable={immutableMap}
          map={mapShallow}
          map_of_maps={mapOfMaps}
          object_of_objects={objectOfObjects}
          react_element={<span />}
          regexp={/abc/giu}
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

    const {
      anonymous_fn,
      array_buffer,
      array_of_arrays,
      big_int,
      bound_fn,
      data_view,
      date,
      fn,
      html_element,
      immutable,
      map,
      map_of_maps,
      object_of_objects,
      react_element,
      regexp,
      set,
      set_of_sets,
      symbol,
      typed_array,
    } = inspectedElement.props;

    const {meta} = require('react-devtools-shared/src/hydration');

    expect(anonymous_fn[meta.inspectable]).toBe(false);
    expect(anonymous_fn[meta.name]).toBe('function');
    expect(anonymous_fn[meta.type]).toBe('function');
    expect(anonymous_fn[meta.preview_long]).toBe('ƒ () {}');
    expect(anonymous_fn[meta.preview_short]).toBe('ƒ () {}');

    expect(array_buffer[meta.size]).toBe(3);
    expect(array_buffer[meta.inspectable]).toBe(false);
    expect(array_buffer[meta.name]).toBe('ArrayBuffer');
    expect(array_buffer[meta.type]).toBe('array_buffer');
    expect(array_buffer[meta.preview_short]).toBe('ArrayBuffer(3)');
    expect(array_buffer[meta.preview_long]).toBe('ArrayBuffer(3)');

    expect(array_of_arrays[0][meta.size]).toBe(2);
    expect(array_of_arrays[0][meta.inspectable]).toBe(true);
    expect(array_of_arrays[0][meta.name]).toBe('Array');
    expect(array_of_arrays[0][meta.type]).toBe('array');
    expect(array_of_arrays[0][meta.preview_long]).toBe('[Array(3), Array(0)]');
    expect(array_of_arrays[0][meta.preview_short]).toBe('Array(2)');

    expect(big_int[meta.inspectable]).toBe(false);
    expect(big_int[meta.name]).toBe('123');
    expect(big_int[meta.type]).toBe('bigint');

    expect(bound_fn[meta.inspectable]).toBe(false);
    expect(bound_fn[meta.name]).toBe('bound exampleFunction');
    expect(bound_fn[meta.type]).toBe('function');
    expect(bound_fn[meta.preview_long]).toBe('ƒ bound exampleFunction() {}');
    expect(bound_fn[meta.preview_short]).toBe('ƒ bound exampleFunction() {}');

    expect(data_view[meta.size]).toBe(3);
    expect(data_view[meta.inspectable]).toBe(false);
    expect(data_view[meta.name]).toBe('DataView');
    expect(data_view[meta.type]).toBe('data_view');

    expect(date[meta.inspectable]).toBe(false);
    expect(date[meta.type]).toBe('date');

    expect(fn[meta.inspectable]).toBe(false);
    expect(fn[meta.name]).toBe('exampleFunction');
    expect(fn[meta.type]).toBe('function');
    expect(fn[meta.preview_long]).toBe('ƒ exampleFunction() {}');
    expect(fn[meta.preview_short]).toBe('ƒ exampleFunction() {}');

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

    expect(object_of_objects.inner[meta.size]).toBe(3);
    expect(object_of_objects.inner[meta.inspectable]).toBe(true);
    expect(object_of_objects.inner[meta.name]).toBe('');
    expect(object_of_objects.inner[meta.type]).toBe('object');
    expect(object_of_objects.inner[meta.preview_long]).toBe(
      '{boolean: true, number: 123, string: "abc"}',
    );
    expect(object_of_objects.inner[meta.preview_short]).toBe('{…}');

    expect(react_element[meta.inspectable]).toBe(false);
    expect(react_element[meta.name]).toBe('span');
    expect(react_element[meta.type]).toBe('react_element');

    expect(regexp[meta.inspectable]).toBe(false);
    expect(regexp[meta.name]).toBe('/abc/giu');
    expect(regexp[meta.preview_long]).toBe('/abc/giu');
    expect(regexp[meta.preview_short]).toBe('/abc/giu');
    expect(regexp[meta.type]).toBe('regexp');

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
  });

  it('should support objects with no prototype', async () => {
    const Example = () => null;

    const object = Object.create(null);
    object.string = 'abc';
    object.number = 123;
    object.boolean = true;

    act(() =>
      ReactDOM.render(
        <Example object={object} />,
        document.createElement('div'),
      ),
    );

    const id = ((store.getElementIDAtIndex(0): any): number);
    const inspectedElement = await read(id);

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      Object {
        "object": Object {
          "boolean": true,
          "number": 123,
          "string": "abc",
        },
      }
    `);
  });

  it('should support objects with overridden hasOwnProperty', async () => {
    const Example = () => null;

    const object = {
      name: 'blah',
      hasOwnProperty: true,
    };

    act(() =>
      ReactDOM.render(
        <Example object={object} />,
        document.createElement('div'),
      ),
    );

    const id = ((store.getElementIDAtIndex(0): any): number);
    const inspectedElement = await read(id);

    // TRICKY: Don't use toMatchInlineSnapshot() for this test!
    // Our snapshot serializer relies on hasOwnProperty() for feature detection.
    expect(inspectedElement.props.object.name).toBe('blah');
    expect(inspectedElement.props.object.hasOwnProperty).toBe(true);
  });

  it('should not consume iterables while inspecting', async () => {
    const Example = () => null;

    function* generator() {
      yield 1;
      yield 2;
    }

    const iteratable = generator();

    act(() =>
      ReactDOM.render(
        <Example iteratable={iteratable} />,
        document.createElement('div'),
      ),
    );

    const id = ((store.getElementIDAtIndex(0): any): number);
    const inspectedElement = await read(id);

    expect(inspectedElement).toMatchInlineSnapshot(`
      Object {
        "context": Object {},
        "events": undefined,
        "hooks": null,
        "id": 2,
        "owners": null,
        "props": Object {
          "iteratable": Dehydrated {
            "preview_short": Generator,
            "preview_long": Generator,
          },
        },
        "state": null,
      }
    `);

    // Inspecting should not consume the iterable.
    expect(iteratable.next().value).toEqual(1);
    expect(iteratable.next().value).toEqual(2);
    expect(iteratable.next().value).toBeUndefined();
  });

  it('should support custom objects with enumerable properties and getters', async () => {
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

    expect(inspectedElement).toMatchInlineSnapshot(`
      Object {
        "context": Object {},
        "events": undefined,
        "hooks": null,
        "id": 2,
        "owners": null,
        "props": Object {
          "data": Object {
            "_number": 42,
            "number": 42,
          },
        },
        "state": null,
      }
    `);
  });

  it('should support objects with with inherited keys', async () => {
    const Example = () => null;

    const base = Object.create(Object.prototype, {
      enumerableStringBase: {
        value: 1,
        writable: true,
        enumerable: true,
        configurable: true,
      },
      [Symbol('enumerableSymbolBase')]: {
        value: 1,
        writable: true,
        enumerable: true,
        configurable: true,
      },
      nonEnumerableStringBase: {
        value: 1,
        writable: true,
        enumerable: false,
        configurable: true,
      },
      [Symbol('nonEnumerableSymbolBase')]: {
        value: 1,
        writable: true,
        enumerable: false,
        configurable: true,
      },
    });

    const object = Object.create(base, {
      enumerableString: {
        value: 2,
        writable: true,
        enumerable: true,
        configurable: true,
      },
      nonEnumerableString: {
        value: 3,
        writable: true,
        enumerable: false,
        configurable: true,
      },
      123: {
        value: 3,
        writable: true,
        enumerable: true,
        configurable: true,
      },
      [Symbol('nonEnumerableSymbol')]: {
        value: 2,
        writable: true,
        enumerable: false,
        configurable: true,
      },
      [Symbol('enumerableSymbol')]: {
        value: 3,
        writable: true,
        enumerable: true,
        configurable: true,
      },
    });

    act(() =>
      ReactDOM.render(<Example data={object} />, document.createElement('div')),
    );

    const id = ((store.getElementIDAtIndex(0): any): number);
    const inspectedElement = await read(id);

    expect(inspectedElement).toMatchInlineSnapshot(`
      Object {
        "context": Object {},
        "events": undefined,
        "hooks": null,
        "id": 2,
        "owners": null,
        "props": Object {
          "data": Object {
            "123": 3,
            "Symbol(enumerableSymbol)": 3,
            "Symbol(enumerableSymbolBase)": 1,
            "enumerableString": 2,
            "enumerableStringBase": 1,
          },
        },
        "state": null,
      }
    `);
  });

  it('should allow component prop value and value`s prototype has same name params.', async () => {
    const testData = Object.create(
      {
        a: undefined,
        b: Infinity,
        c: NaN,
        d: 'normal',
      },
      {
        a: {
          value: undefined,
          writable: true,
          enumerable: true,
          configurable: true,
        },
        b: {
          value: Infinity,
          writable: true,
          enumerable: true,
          configurable: true,
        },
        c: {
          value: NaN,
          writable: true,
          enumerable: true,
          configurable: true,
        },
        d: {
          value: 'normal',
          writable: true,
          enumerable: true,
          configurable: true,
        },
      },
    );

    const Example = ({data}) => null;
    act(() =>
      ReactDOM.render(
        <Example data={testData} />,
        document.createElement('div'),
      ),
    );

    const id = ((store.getElementIDAtIndex(0): any): number);
    const inspectedElement = await read(id);

    expect(inspectedElement.props).toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "a": undefined,
          "b": Infinity,
          "c": NaN,
          "d": "normal",
        },
      }
    `);
  });

  it('should not dehydrate nested values until explicitly requested', async () => {
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
    expect(inspectedElement.props).toMatchInlineSnapshot(`
      Object {
        "nestedObject": Object {
          "a": Dehydrated {
            "preview_short": {…},
            "preview_long": {b: {…}},
          },
        },
      }
    `);

    inspectedElement = await read(id, ['props', 'nestedObject', 'a']);
    expect(inspectedElement.props).toMatchInlineSnapshot(`
      Object {
        "nestedObject": Object {
          "a": Object {
            "b": Object {
              "c": Dehydrated {
                "preview_short": Array(1),
                "preview_long": [{…}],
              },
            },
          },
        },
      }
    `);

    inspectedElement = await read(id, ['props', 'nestedObject', 'a', 'b', 'c']);
    expect(inspectedElement.props).toMatchInlineSnapshot(`
      Object {
        "nestedObject": Object {
          "a": Object {
            "b": Object {
              "c": Array [
                Object {
                  "d": Dehydrated {
                    "preview_short": {…},
                    "preview_long": {e: {…}},
                  },
                },
              ],
            },
          },
        },
      }
    `);

    inspectedElement = await read(id, [
      'props',
      'nestedObject',
      'a',
      'b',
      'c',
      0,
      'd',
    ]);
    expect(inspectedElement.props).toMatchInlineSnapshot(`
      Object {
        "nestedObject": Object {
          "a": Object {
            "b": Object {
              "c": Array [
                Object {
                  "d": Object {
                    "e": Object {},
                  },
                },
              ],
            },
          },
        },
      }
    `);
  });

  it('should enable inspected values to be stored as global variables', () => {
    const Example = () => null;

    const nestedObject = {
      a: {
        value: 1,
        b: {
          value: 1,
          c: {
            value: 1,
          },
        },
      },
    };

    act(() =>
      ReactDOM.render(
        <Example nestedObject={nestedObject} />,
        document.createElement('div'),
      ),
    );

    const id = ((store.getElementIDAtIndex(0): any): number);
    const rendererID = ((store.getRendererIDForElement(id): any): number);

    const logSpy = jest.fn();
    spyOn(console, 'log').and.callFake(logSpy);

    // Should store the whole value (not just the hydrated parts)
    backendAPI.storeAsGlobal({
      bridge,
      id,
      path: ['props', 'nestedObject'],
      rendererID,
    });

    jest.runOnlyPendingTimers();
    expect(logSpy).toHaveBeenCalledWith('$reactTemp0');
    expect(global.$reactTemp0).toBe(nestedObject);

    logSpy.mockReset();

    // Should store the nested property specified (not just the outer value)
    backendAPI.storeAsGlobal({
      bridge,
      id,
      path: ['props', 'nestedObject', 'a', 'b'],
      rendererID,
    });

    jest.runOnlyPendingTimers();
    expect(logSpy).toHaveBeenCalledWith('$reactTemp1');
    expect(global.$reactTemp1).toBe(nestedObject.a.b);
  });

  it('should enable inspected values to be copied to the clipboard', () => {
    const Example = () => null;

    const nestedObject = {
      a: {
        value: 1,
        b: {
          value: 1,
          c: {
            value: 1,
          },
        },
      },
    };

    act(() =>
      ReactDOM.render(
        <Example nestedObject={nestedObject} />,
        document.createElement('div'),
      ),
    );

    const id = ((store.getElementIDAtIndex(0): any): number);
    const rendererID = ((store.getRendererIDForElement(id): any): number);

    // Should copy the whole value (not just the hydrated parts)
    backendAPI.copyInspectedElementPath({
      bridge,
      id,
      path: ['props', 'nestedObject'],
      rendererID,
    });

    jest.runOnlyPendingTimers();
    expect(global.mockClipboardCopy).toHaveBeenCalledTimes(1);
    expect(global.mockClipboardCopy).toHaveBeenCalledWith(
      JSON.stringify(nestedObject),
    );

    global.mockClipboardCopy.mockReset();

    // Should copy the nested property specified (not just the outer value)
    backendAPI.copyInspectedElementPath({
      bridge,
      id,
      path: ['props', 'nestedObject', 'a', 'b'],
      rendererID,
    });

    jest.runOnlyPendingTimers();
    expect(global.mockClipboardCopy).toHaveBeenCalledTimes(1);
    expect(global.mockClipboardCopy).toHaveBeenCalledWith(
      JSON.stringify(nestedObject.a.b),
    );
  });

  it('should enable complex values to be copied to the clipboard', () => {
    const Immutable = require('immutable');

    const Example = () => null;

    const set = new Set(['abc', 123]);
    const map = new Map([
      ['name', 'Brian'],
      ['food', 'sushi'],
    ]);
    const setOfSets = new Set([new Set(['a', 'b', 'c']), new Set([1, 2, 3])]);
    const mapOfMaps = new Map([
      ['first', map],
      ['second', map],
    ]);
    const typedArray = Int8Array.from([100, -100, 0]);
    const arrayBuffer = typedArray.buffer;
    const dataView = new DataView(arrayBuffer);
    const immutable = Immutable.fromJS({
      a: [{hello: 'there'}, 'fixed', true],
      b: 123,
      c: {
        '1': 'xyz',
        xyz: 1,
      },
    });
    // $FlowFixMe
    const bigInt = BigInt(123); // eslint-disable-line no-undef

    act(() =>
      ReactDOM.render(
        <Example
          arrayBuffer={arrayBuffer}
          dataView={dataView}
          map={map}
          set={set}
          mapOfMaps={mapOfMaps}
          setOfSets={setOfSets}
          typedArray={typedArray}
          immutable={immutable}
          bigInt={bigInt}
        />,
        document.createElement('div'),
      ),
    );

    const id = ((store.getElementIDAtIndex(0): any): number);
    const rendererID = ((store.getRendererIDForElement(id): any): number);

    // Should copy the whole value (not just the hydrated parts)
    backendAPI.copyInspectedElementPath({
      bridge,
      id,
      path: ['props'],
      rendererID,
    });
    jest.runOnlyPendingTimers();
    // Should not error despite lots of unserialized values.

    global.mockClipboardCopy.mockReset();

    // Should copy the nested property specified (not just the outer value)
    backendAPI.copyInspectedElementPath({
      bridge,
      id,
      path: ['props', 'bigInt'],
      rendererID,
    });
    jest.runOnlyPendingTimers();
    expect(global.mockClipboardCopy).toHaveBeenCalledTimes(1);
    expect(global.mockClipboardCopy).toHaveBeenCalledWith(
      JSON.stringify('123n'),
    );

    global.mockClipboardCopy.mockReset();

    // Should copy the nested property specified (not just the outer value)
    backendAPI.copyInspectedElementPath({
      bridge,
      id,
      path: ['props', 'typedArray'],
      rendererID,
    });
    jest.runOnlyPendingTimers();
    expect(global.mockClipboardCopy).toHaveBeenCalledTimes(1);
    expect(global.mockClipboardCopy).toHaveBeenCalledWith(
      JSON.stringify({0: 100, 1: -100, 2: 0}),
    );
  });
});
