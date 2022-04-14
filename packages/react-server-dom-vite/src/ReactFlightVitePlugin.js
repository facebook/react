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
  isServerComponentImporterAllowed?: (
    importer: string,
    source: string,
  ) => boolean,
  findClientComponentsForDev?: (
    config: any,
    server: any,
  ) => string[] | Promise<string[]>,
  findClientComponentsForClientBuild?: (
    config: any,
  ) => string[] | Promise<string[]>,
  isClientComponent?: (id: string) => boolean,
};

const rscViteFileRE = /\/react-server-dom-vite.js/;

export default function ReactFlightVitePlugin({
  isServerComponentImporterAllowed = importer => false,
  isClientComponent = id => /\.client\.[jt]sx?($|\?)/.test(id),
  findClientComponentsForDev,
  findClientComponentsForClientBuild,
}: PluginOptions = {}) {
  let config;
  let server;
  let timeout;
  let absoluteImporterPath;
  let discoveredClientComponents = [];

  if (!findClientComponentsForDev) {
    findClientComponentsForDev = () =>
      Array.from(server.moduleGraph.fileToModulesMap.keys()).filter(
        isClientComponent,
      );
  }

  return {
    name: 'vite-plugin-react-server-components',

    enforce: 'pre',

    configureServer(_server) {
      server = _server;
    },

    async configResolved(_config: any) {
      config = _config;

      // By pushing this plugin at the end of the existing array,
      // we enforce running it *after* Vite resolves import.meta.glob.
      config.plugins.push(hashImportsPlugin);

      if (config.command === 'build' && !config.build.ssr) {
        if (findClientComponentsForClientBuild) {
          discoveredClientComponents = await findClientComponentsForClientBuild(
            config,
          );
        } else {
          throw new Error(
            '[react-server-dom-vite] Parameter findClientComponentsForClientBuild is required for client build',
          );
        }
      }
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
      if (isClientComponent(id) && !/[&?]no-proxy($|&)/.test(id)) {
        if (config.command === 'serve') {
          // Refresh the list of discovered client components
          // every time a new one is processed.
          clearTimeout(timeout);
          timeout = setTimeout(async () => {
            discoveredClientComponents = findClientComponentsForDev
              ? await findClientComponentsForDev(config, server)
              : [];

            if (absoluteImporterPath) {
              // Signal Vite that this file needs to be
              // refreshed in both server and browser.
              server.watcher.emit('change', absoluteImporterPath);
            }
          }, 100);
        }

        return proxyClientComponent(id);
      }

      return null;
    },

    transform(code: string, id: string, options: {ssr?: boolean} = {}) {
      /**
       * In order to allow dynamic component imports from RSC, we use Vite's import.meta.glob.
       * This hook replaces the glob placeholders with resolved paths to all client components.
       *
       * NOTE: Glob import paths MUST be relative to the importer file in
       * order to get the `?v=xxx` querystring from Vite added to the import URL.
       * If the paths are relative to the root instead, Vite won't add the querystring
       * and we will have duplicated files in the browser (with duplicated contexts, etc).
       */
      if (rscViteFileRE.test(id)) {
        const INJECTING_RE = /\{\s*__INJECTED_CLIENT_IMPORTERS__[:\s]*null[,\s]*\}\s*;/;
        absoluteImporterPath = id.split('?')[0];

        if (options && options.ssr) {
          // In SSR, directly use components already discovered by RSC
          // instead of globs to avoid bundling unused components.
          return code.replace(INJECTING_RE, 'globalThis.__COMPONENT_INDEX');
        }

        const importerPath = path.dirname(id);
        const importers = discoveredClientComponents.map(absolutePath =>
          normalizePath(path.relative(importerPath, absolutePath)),
        );

        const injectedGlobs = `Object.assign(Object.create(null), ${importers
          .map(
            glob =>
              // Mark the globs to modify the result after Vite resolves them.
              `/* HASH_BEGIN */ ` +
              `import.meta.glob('${normalizePath(glob)}') /* HASH_END */`,
          )
          .join(', ')});`;

        return code.replace(INJECTING_RE, injectedGlobs);
      }
    },
  };
}

const btoa = (hash: number) =>
  // eslint-disable-next-line react-internal/safe-string-coercion
  Buffer.from(String(hash), 'binary').toString('base64');

// Quick, lossy hash function: https://stackoverflow.com/a/8831937/4468962
// Prevents leaking path information in the browser, and minifies RSC responses.
function hashCode(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash;
  }

  return btoa(hash).replace(/=+/, '');
}

const getComponentFilename = (filepath: string) =>
  filepath
    .split('/')
    .pop()
    .split('.')
    .shift();

export const getComponentId = (filepath: string) =>
  `${getComponentFilename(filepath)}-${hashCode(filepath)}`;

export async function proxyClientComponent(filepath: string, src?: string) {
  const DEFAULT_EXPORT = 'default';

  // Modify the import ID to avoid infinite wraps
  const importFrom = `${filepath}?no-proxy`;

  await init;

  if (!src) {
    src = await fs.readFile(filepath, 'utf-8');
  }

  const {code} = await transformWithEsbuild(src, filepath);
  const [, exportStatements] = parse(code);

  let proxyCode =
    `import {wrapInClientProxy} from 'react-server-dom-vite/client-proxy';\n` +
    `import * as allImports from '${importFrom}';\n\n`;

  // Wrap components in Client Proxy
  exportStatements.forEach(key => {
    const isDefault = key === DEFAULT_EXPORT;
    const componentName = isDefault ? getComponentFilename(filepath) : key;

    proxyCode += `export ${
      isDefault ? DEFAULT_EXPORT : `const ${componentName} =`
    } wrapInClientProxy({ name: '${componentName}', id: '${getComponentId(
      filepath,
    )}', value: allImports['${key}'], isDefault: ${
      // eslint-disable-next-line react-internal/safe-string-coercion
      String(isDefault)
    } });\n`;
  });

  return proxyCode;
}

const hashImportsPlugin = {
  name: 'vite-plugin-react-server-components-hash-imports',
  enforce: 'post',
  transform(code: string, id: string) {
    // Turn relative import paths to lossy hashes
    if (rscViteFileRE.test(id)) {
      return code.replace(
        /\/\*\s*HASH_BEGIN\s*\*\/\s*([^]+?)\/\*\s*HASH_END\s*\*\//gm,
        function(_, imports) {
          return imports
            .trim()
            .replace(/"([^"]+?)":/gm, function(__, relativePath) {
              const absolutePath = path.resolve(
                path.dirname(id.split('?')[0]),
                relativePath,
              );

              return `"${getComponentId(normalizePath(absolutePath))}":`;
            });
        },
      );
    }
  },
};
