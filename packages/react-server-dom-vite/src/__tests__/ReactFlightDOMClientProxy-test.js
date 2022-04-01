/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ClientProxy;

const id = '/path/to/Counter.jsx';
const name = 'Counter';

jest.mock('react', () => {
  const actualModule = jest.requireActual('react');
  return {
    ...actualModule,
    useState: jest.fn(() => undefined),
  };
});

const wrapInClientProxy = value =>
  ClientProxy.wrapInClientProxy({id, name, isDefault: true, value});

describe('ReactFlightDOMClientProxy', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ClientProxy = require('../ClientProxy');
  });

  it('does not affect the exports in non-RSC environments', () => {
    React.useState.mockReturnValue(undefined);

    const wrappedElement = wrapInClientProxy(<div>test</div>);
    expect(wrappedElement).toHaveProperty(
      '$$typeof',
      Symbol.for('react.element'),
    );

    const wrappedComponent = wrapInClientProxy(() => <div>test</div>);
    expect(typeof wrappedComponent).toEqual('function');
    expect(wrappedComponent).not.toHaveProperty('$$typeof');

    [(42, '42', null, undefined)].forEach(value =>
      expect(wrapInClientProxy(value)).toEqual(value),
    );
  });

  it('does not allow calling exported functions or reading properties in RSC', () => {
    const myFn = () => true;
    myFn.myProp = true;

    React.useState.mockReturnValue(undefined);
    const wrappedFnSsr = wrapInClientProxy(myFn);
    expect(wrappedFnSsr.myProp).toEqual(true);
    expect(wrappedFnSsr()).toEqual(true);

    React.useState.mockImplementation(() => {
      throw new Error('Not supported in Server Components.');
    });
    const wrappedFnRsc = wrapInClientProxy(myFn);
    expect(wrappedFnRsc.myProp).toEqual(undefined);
    expect(() => wrappedFnRsc()).toThrowError(ClientProxy.FN_RSC_ERROR);
    expect(() => new wrappedFnRsc()).toThrowError(ClientProxy.FN_RSC_ERROR);
  });

  it('wraps client components in a proxy during RSC', async () => {
    React.useState.mockImplementation(() => {
      throw new Error('Not supported in Server Components.');
    });

    const wrappedComponent = wrapInClientProxy(() => <div>MyCounter</div>);

    expect(wrappedComponent).toHaveProperty('$$typeof', ClientProxy.MODULE_TAG);

    expect(typeof wrappedComponent).toEqual('function');
    expect(wrappedComponent).toHaveProperty('filepath', id);
    expect(wrappedComponent).toHaveProperty('name', 'default');
  });

  it('registers module references for long strings globally', () => {
    // eslint-disable-next-line no-unused-vars
    /*global globalThis*/

    const shortString = 'a'.repeat(ClientProxy.STRING_SIZE_LIMIT - 1);
    const wrappedShortString = wrapInClientProxy(shortString);
    expect(shortString).toEqual(wrappedShortString);
    expect(globalThis.__STRING_REFERENCE_INDEX[shortString]).toEqual(undefined);

    const longString = 'a'.repeat(ClientProxy.STRING_SIZE_LIMIT);
    const wrappedLongString = wrapInClientProxy(longString);
    expect(longString).toEqual(wrappedLongString);
    expect(globalThis.__STRING_REFERENCE_INDEX[longString]).toMatchObject({
      $$typeof: ClientProxy.MODULE_TAG,
      filepath: id,
      name: 'default',
    });
  });
});
