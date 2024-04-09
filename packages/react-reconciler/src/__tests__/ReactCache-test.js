/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactNoopFlightServer;
let ReactNoopFlightClient;
let cache;

describe('ReactCache', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.mock('react', () => require('react/react.react-server'));
    React = require('react');

    ReactNoopFlightServer = require('react-noop-renderer/flight-server');
    ReactNoopFlightClient = require('react-noop-renderer/flight-client');

    cache = React.cache;

    jest.resetModules();
    __unmockReact();
  });

  // @gate enableCache
  it('cache objects and primitive arguments and a mix of them', async () => {
    const types = cache((a, b) => ({a: typeof a, b: typeof b}));
    function Print({a, b}) {
      return types(a, b).a + ' ' + types(a, b).b + ' ';
    }
    function Same({a, b}) {
      const x = types(a, b);
      const y = types(a, b);
      return (x === y).toString() + ' ';
    }
    function FlippedOrder({a, b}) {
      return (types(a, b) === types(b, a)).toString() + ' ';
    }
    function FewerArgs({a, b}) {
      return (types(a, b) === types(a)).toString() + ' ';
    }
    function MoreArgs({a, b}) {
      return (types(a) === types(a, b)).toString() + ' ';
    }

    expect(
      (
        await ReactNoopFlightClient.read(
          ReactNoopFlightServer.render(
            <>
              <Print a="e" b="f" />
              <Same a="a" b="b" />
              <FlippedOrder a="c" b="d" />
              <FewerArgs a="e" b="f" />
              <MoreArgs a="g" b="h" />
            </>,
          ),
        )
      ).join(''),
    ).toEqual('string string true false false false ');

    expect(
      (
        await ReactNoopFlightClient.read(
          ReactNoopFlightServer.render(
            <>
              <Print a="e" b={null} />
              <Same a="a" b={null} />
              <FlippedOrder a="c" b={null} />
              <FewerArgs a="e" b={null} />
              <MoreArgs a="g" b={null} />
            </>,
          ),
        )
      ).join(''),
    ).toEqual('string object true false false false ');

    const obj = {};
    expect(
      (
        await ReactNoopFlightClient.read(
          ReactNoopFlightServer.render(
            <>
              <Print a="e" b={obj} />
              <Same a="a" b={obj} />
              <FlippedOrder a="c" b={obj} />
              <FewerArgs a="e" b={obj} />
              <MoreArgs a="g" b={obj} />
            </>,
          ),
        )
      ).join(''),
    ).toEqual('string object true false false false ');

    const sameObj = {};
    expect(
      (
        await ReactNoopFlightClient.read(
          ReactNoopFlightServer.render(
            <>
              <Print a={sameObj} b={sameObj} />
              <Same a={sameObj} b={sameObj} />
              <FlippedOrder a={sameObj} b={sameObj} />
              <FewerArgs a={sameObj} b={sameObj} />
              <MoreArgs a={sameObj} b={sameObj} />
            </>,
          ),
        )
      ).join(''),
    ).toEqual('object object true true false false ');

    const objA = {};
    const objB = {};
    expect(
      (
        await ReactNoopFlightClient.read(
          ReactNoopFlightServer.render(
            <>
              <Print a={objA} b={objB} />
              <Same a={objA} b={objB} />
              <FlippedOrder a={objA} b={objB} />
              <FewerArgs a={objA} b={objB} />
              <MoreArgs a={objA} b={objB} />
            </>,
          ),
        )
      ).join(''),
    ).toEqual('object object true false false false ');

    const sameSymbol = Symbol();
    expect(
      (
        await ReactNoopFlightClient.read(
          ReactNoopFlightServer.render(
            <>
              <Print a={sameSymbol} b={sameSymbol} />
              <Same a={sameSymbol} b={sameSymbol} />
              <FlippedOrder a={sameSymbol} b={sameSymbol} />
              <FewerArgs a={sameSymbol} b={sameSymbol} />
              <MoreArgs a={sameSymbol} b={sameSymbol} />
            </>,
          ),
        )
      ).join(''),
    ).toEqual('symbol symbol true true false false ');

    const notANumber = +'nan';
    expect(
      (
        await ReactNoopFlightClient.read(
          ReactNoopFlightServer.render(
            <>
              <Print a={1} b={notANumber} />
              <Same a={1} b={notANumber} />
              <FlippedOrder a={1} b={notANumber} />
              <FewerArgs a={1} b={notANumber} />
              <MoreArgs a={1} b={notANumber} />
            </>,
          ),
        )
      ).join(''),
    ).toEqual('number number true false false false ');
  });

  // @gate enableCache
  it('cached functions that throw should cache the error', async () => {
    const throws = cache(v => {
      throw new Error(v);
    });
    let x;
    let y;
    let z;
    function Test() {
      try {
        throws(1);
      } catch (e) {
        x = e;
      }
      try {
        throws(1);
      } catch (e) {
        y = e;
      }
      try {
        throws(2);
      } catch (e) {
        z = e;
      }

      return 'Blank';
    }

    ReactNoopFlightServer.render(<Test />);
    expect(x).toBe(y);
    expect(z).not.toBe(x);
  });

  // @gate enableCache
  it('introspection of returned wrapper function is same on client and server', async () => {
    // When the variant flag is true, test the client version of `cache`.
    if (gate(flags => flags.variant)) {
      jest.resetModules();
      jest.mock('react', () => jest.requireActual('react'));
      const ClientReact = require('react');
      cache = ClientReact.cache;
    }

    function foo(a, b, c) {
      return a + b + c;
    }
    foo.displayName = 'Custom display name';

    const cachedFoo = cache(foo);
    expect(cachedFoo).not.toBe(foo);
    expect(cachedFoo.length).toBe(0);
    expect(cachedFoo.displayName).toBe(undefined);
  });
});
