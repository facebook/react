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

describe('ReactFlightDOMClientProxy', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ClientProxy = require('../ClientProxy');
  });

  it('should wrap client components in a proxy', async () => {
    const result = ClientProxy.wrapInClientProxy({
      id,
      name,
      named: false,
      component: <div>MyCounter</div>,
    });

    expect(typeof result).toEqual('object');
    expect(typeof result.render).toEqual('function');
    expect(result.filepath).toEqual(id);
    expect(result.name).toEqual('default');

    if (process.env.NODE_ENV !== 'production') {
      expect(result.render.displayName).toEqual(name);
    }
  });

  it('should not wrap anything that is not a React component', () => {
    const result = ClientProxy.wrapInClientProxy({
      id,
      name,
      named: true,
      component: '42',
    });

    expect(result).toEqual('42');
  });
});
