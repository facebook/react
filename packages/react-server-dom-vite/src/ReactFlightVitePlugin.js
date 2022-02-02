/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// $FlowFixMe[module-missing]
import {init, parse} from 'es-module-lexer';
// $FlowFixMe[module-missing]
import {normalizePath, transformWithEsbuild} from 'vite';

import {promises as fs} from 'fs';
import path from 'path';

type PluginOptions = {
  clientComponentPaths?: string[],
  isServerComponentImporterAllowed?: (
    importer: string,
    source: string,
  ) => boolean,
};

export default function ReactFlightVitePlugin({
  clientComponentPaths = [],
  isServerComponentImporterAllowed = importer => false,
}: PluginOptions = {}) {
  let config;

  return {
    name: 'vite-plugin-react-server-components',

    enforce: 'pre',

    configResolved(_config: any) {
      config = _config;
    },

    async resolveId(source: string, importer: string) {
      if (!importer) return null;

      /**
       * Throw errors when non-Server Components try to load Server Components.
       */
      if (
        /\.server(\.[jt]sx?)?$/.test(source) &&
        !(
          /(\.server\.[jt]sx?|entry-server\.[jt]sx?|index\.html)$/.test(
            importer,
          ) || isServerComponentImporterAllowed(importer, source)
        )
      ) {
        throw new Error(
          `Cannot import ${source} from "${importer}". ` +
            'By react-server convention, .server.js files can only be imported from other .server.js files. ' +
            'That way nobody accidentally sends these to the client by indirectly importing it.',
        );
      }
    },

    async load(id: string, options: {ssr?: boolean} = {}) {
      if (!options.ssr) return null;

      // Wrapped components won't match this becase they end in ?no-proxy
      if (/\.client\.[jt]sx?$/.test(id)) {
        return proxyClientComponent(id);
      }

      return null;
    },

    transform(code: string, id: string) {
      /**
       * In order to allow dynamic component imports from RSC, we use Vite's import.meta.glob.
       * This hook replaces the glob placeholders with resolved paths to all client components.
       *
       * NOTE: Glob import paths MUST be relative to the importer file in
       * order to get the `?v=xxx` querystring from Vite added to the import URL.
       * If the paths are relative to the root instead, Vite won't add the querystring
       * and we will have duplicated files in the browser (with duplicated contexts, etc).
       */
      if (/\/react-server-dom-vite.js/.test(id)) {
        const CLIENT_COMPONENT_GLOB = '**/*.client.[jt]s?(x)';

        const importerPath = path.dirname(id);
        const importerToRootPath = normalizePath(
          path.relative(importerPath, config.root),
        );
        const [importerToRootNested] =
          importerToRootPath.match(/(\.\.\/)+(\.\.)?/) || [];

        const userPrefix = path.normalize(
          path.join(
            importerPath,
            importerToRootNested.replace(/\/?$/, path.sep),
          ),
        );
        const userGlob = path.join(
          importerToRootPath,
          'src',
          CLIENT_COMPONENT_GLOB,
        );

        const importers = [[userGlob, userPrefix]];

        clientComponentPaths.forEach(componentPath => {
          const libPrefix = componentPath + path.sep;
          const libGlob = path.join(
            path.relative(importerPath, componentPath),
            CLIENT_COMPONENT_GLOB,
          );

          importers.push([libGlob, libPrefix]);
        });

        const injectedGlobs = `Object.assign(Object.create(null), ${importers
          .map(
            ([glob, prefix]) =>
              `__vncp(import.meta.glob('${normalizePath(
                glob,
              )}'), '${normalizePath(prefix)}')`,
          )
          .join(', ')});`;

        return code.replace(
          /\{\s*__INJECTED_CLIENT_IMPORTERS__[:\s]*null[,\s]*\}\s*;/,
          injectedGlobs + serializedNormalizePaths(),
        );
      }
    },
  };
}

const serializedNormalizePaths = () => `
function __vncp(obj, prefix) {
  const nestedRE = /\\.\\.\\//gm;
  return Object.keys(obj).reduce(function (acc, key) {
    acc[prefix + key.replace(nestedRE, '')] = obj[key];
    return acc;
  }, {});
}
`;

export async function proxyClientComponent(id: string, src?: string) {
  const DEFAULT_EXPORT = 'default';

  // Modify the import ID to avoid infinite wraps
  const importFrom = `${id}?no-proxy`;

  await init;

  if (!src) {
    src = await fs.readFile(id, 'utf-8');
  }

  const {code} = await transformWithEsbuild(src, id);
  const [, exportStatements] = parse(code);

  let proxyCode =
    `import {wrapInClientProxy} from 'react-server-dom-vite/client-proxy';\n` +
    `import * as allImports from '${importFrom}';\n\n`;

  // Wrap components in Client Proxy
  exportStatements.forEach(key => {
    const isDefault = key === DEFAULT_EXPORT;
    const componentName = isDefault
      ? id
          .split('/')
          .pop()
          .split('.')
          .shift()
      : key;

    proxyCode += `export ${
      isDefault ? DEFAULT_EXPORT : `const ${componentName} =`
    } wrapInClientProxy({ name: '${componentName}', id: '${id}', component: allImports['${key}'], named: ${
      // eslint-disable-next-line react-internal/safe-string-coercion
      String(!isDefault)
    } });\n`;
  });

  return proxyCode;
}
