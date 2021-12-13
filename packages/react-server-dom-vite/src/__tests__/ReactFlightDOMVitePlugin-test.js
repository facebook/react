/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let proxyClientComponent;

describe('ReactFlightVitePlugin', () => {
  beforeEach(() => {
    jest.resetModules();
    proxyClientComponent = require('../ReactFlightVitePlugin')
      .proxyClientComponent;
  });

  it('wraps default exports for dev', async () => {
    expect(
      await proxyClientComponent(
        '/path/to/Counter.client.jsx',
        `export default function() {}`,
      ),
    )
      .toBe(`import {wrapInClientProxy} from 'react-server-dom-vite/client-proxy';
import * as allImports from '/path/to/Counter.client.jsx?no-proxy';

export default wrapInClientProxy({ name: 'Counter', id: '/path/to/Counter.client.jsx', component: allImports['default'], named: false });
`);
  });

  it('wraps named exports', async () => {
    expect(
      await proxyClientComponent(
        '/path/to/Counter.client.jsx',
        `export function Counter() {}\nexport const Clicker = () => {};`,
      ),
    )
      .toBe(`import {wrapInClientProxy} from 'react-server-dom-vite/client-proxy';
import * as allImports from '/path/to/Counter.client.jsx?no-proxy';

export const Counter = wrapInClientProxy({ name: 'Counter', id: '/path/to/Counter.client.jsx', component: allImports['Counter'], named: true });
export const Clicker = wrapInClientProxy({ name: 'Clicker', id: '/path/to/Counter.client.jsx', component: allImports['Clicker'], named: true });
`);
  });

  it('combines default and named exports', async () => {
    expect(
      await proxyClientComponent(
        '/path/to/Counter.client.jsx',
        `export default function() {}\nexport const Clicker = () => {};`,
      ),
    )
      .toBe(`import {wrapInClientProxy} from 'react-server-dom-vite/client-proxy';
import * as allImports from '/path/to/Counter.client.jsx?no-proxy';

export default wrapInClientProxy({ name: 'Counter', id: '/path/to/Counter.client.jsx', component: allImports['default'], named: false });
export const Clicker = wrapInClientProxy({ name: 'Clicker', id: '/path/to/Counter.client.jsx', component: allImports['Clicker'], named: true });
`);
  });

  it('does not wrap non-component exports', async () => {
    expect(
      await proxyClientComponent(
        '/path/to/Counter.client.jsx',
        `export default function() {}\nexport const MyFragment = 'fragment myFragment on MyQuery { id }';`,
      ),
    )
      .toBe(`import {wrapInClientProxy} from 'react-server-dom-vite/client-proxy';
import * as allImports from '/path/to/Counter.client.jsx?no-proxy';

export {MyFragment} from '/path/to/Counter.client.jsx?no-proxy';
export default wrapInClientProxy({ name: 'Counter', id: '/path/to/Counter.client.jsx', component: allImports['default'], named: false });
`);
  });

  it('can export non-component only', async () => {
    expect(
      await proxyClientComponent(
        '/path/to/Counter.client.jsx',
        `export const LocalizationContext = {}; export const useMyStuff = () => {}; export const MY_CONSTANT = 42;`,
      ),
    ).toBe(`export * from '/path/to/Counter.client.jsx?no-proxy';\n`);
  });
});
