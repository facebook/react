/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let proxyClientComponent, getComponentId;

jest.mock('../ViteImportMeta', () => {
  return {META_HOT: null};
});

describe('ReactFlightVitePlugin', () => {
  beforeEach(() => {
    jest.resetModules();
    const plugin = require('../ReactFlightVitePlugin');
    proxyClientComponent = (...args) =>
      plugin.proxyClientComponent(...args).then(result => result.code);
    getComponentId = plugin.getComponentId;
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

export default /* @__PURE__ */wrapInClientProxy({ name: 'Counter', id: '${getComponentId(
      '/path/to/Counter.client.jsx',
    )}', value: allImports['default'], isDefault: true });
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

export const Counter = /* @__PURE__ */wrapInClientProxy({ name: 'Counter', id: '${getComponentId(
      '/path/to/Counter.client.jsx',
    )}', value: allImports['Counter'], isDefault: false });
export const Clicker = /* @__PURE__ */wrapInClientProxy({ name: 'Clicker', id: '${getComponentId(
      '/path/to/Counter.client.jsx',
    )}', value: allImports['Clicker'], isDefault: false });
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

export default /* @__PURE__ */wrapInClientProxy({ name: 'Counter', id: '${getComponentId(
      '/path/to/Counter.client.jsx',
    )}', value: allImports['default'], isDefault: true });
export const Clicker = /* @__PURE__ */wrapInClientProxy({ name: 'Clicker', id: '${getComponentId(
      '/path/to/Counter.client.jsx',
    )}', value: allImports['Clicker'], isDefault: false });
`);
  });
});
