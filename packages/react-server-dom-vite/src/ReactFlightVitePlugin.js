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
import MagicString from 'magic-string';
// $FlowFixMe[module-missing]
import {normalizePath, transformWithEsbuild, createServer} from 'vite';

import {promises as fs} from 'fs';
import path from 'path';

type PluginOptions = {
  serverBuildEntries: string[],
  isServerComponentImporterAllowed?: (
    importer: string,
    source: string,
  ) => boolean,
};

const rscViteFileRE = /\/react-server-dom-vite.js/;
const noProxyRE = /[&?]no-proxy($|&)/;

const isClientComponent = id => /\.client\.[jt]sx?($|\?)/.test(id);

export default function ReactFlightVitePlugin({
  serverBuildEntries,
  isServerComponentImporterAllowed = importer => false,
}: PluginOptions = {}) {
  let config;
  let server;
  let invalidateTimeout;
  let globImporterPath;

  function invalidateGlobImporter() {
    clearTimeout(invalidateTimeout);
    invalidateTimeout = setTimeout(
      () => server.watcher.emit('change', globImporterPath),
      100,
    );
  }

  return {
    name: 'vite-plugin-react-server-components',
    enforce: 'pre',

    configureServer(_server: any) {
      server = _server;
    },

    configResolved(_config: any) {
      config = _config;

      // By pushing this plugin at the end of the existing array,
      // we enforce running it *after* Vite resolves import.meta.glob.
      config.plugins.push(hashImportsPlugin);
    },

    resolveId(source: string, importer: string) {
      if (!importer) return null;

      /**
       * Throw errors when non-Server Components try to load Server Components.
       */
      if (
        /\.server(\.[jt]sx?)?$/.test(source) &&
        !(
          /(\.server\.[jt]sx?|index\.html)$/.test(importer) ||
          isServerComponentImporterAllowed(importer, source)
        )
      ) {
        throw new Error(
          `Cannot import ${source} from "${importer}". ` +
            'By react-server convention, .server.js files can only be imported from other .server.js files. ' +
            'That way nobody accidentally sends these to the client by indirectly importing it.',
        );
      }
    },

    load(id: string, options: {ssr?: boolean} = {}) {
      if (!options.ssr || !isClientComponent(id) || noProxyRE.test(id)) return;

      if (server) {
        const mod = server.moduleGraph.idToModuleMap.get(
          id.replace('/@fs', ''),
        );

        if (mod && mod.importers) {
          if (
            Array.from(mod.importers).every(impMod => noProxyRE.test(impMod.id))
          ) {
            // This module is only imported from client components
            // so we don't need to create a module reference
            return;
          }
        }

        // Mark module as a client component.
        const moduleNode = server.moduleGraph.getModuleById(id);
        if (!moduleNode.meta) moduleNode.meta = {};
        if (!moduleNode.meta.isClientComponent) {
          moduleNode.meta.isClientComponent = true;
          if (globImporterPath) invalidateGlobImporter();
        }
      }

      return proxyClientComponent(id.split('?')[0]);
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
        const s = new MagicString(code);

        id = id.split('?')[0];

        if (options && options.ssr) {
          // In SSR, directly use components already discovered by RSC
          // instead of globs to avoid bundling unused components.
          s.replace(INJECTING_RE, 'globalThis.__COMPONENT_INDEX');

          return {
            code: s.toString(),
            map: s.generateMap({file: id, source: id}),
          };
        }

        const injectGlobs = (clientComponents: string[]) => {
          const importerPath = path.dirname(id);
          const importers = clientComponents.map(absolutePath =>
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

          s.replace(INJECTING_RE, injectedGlobs);

          return {
            code: s.toString(),
            map: s.generateMap({file: id, source: id}),
          };
        };

        if (config.command === 'serve') {
          globImporterPath = id;
          return injectGlobs(findClientBoundaries(server.moduleGraph));
        }

        if (!serverBuildEntries) {
          throw new Error(
            '[react-server-dom-vite] Parameter serverBuildEntries is required for client build',
          );
        }

        return findClientBoundariesForClientBuild(serverBuildEntries).then(
          injectGlobs,
        );
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

function findClientBoundaries(moduleGraph: any) {
  const clientBoundaries = [];

  // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  for (const set of moduleGraph.fileToModulesMap.values()) {
    const clientModule = Array.from(set).find(
      moduleNode => moduleNode.meta && moduleNode.meta.isClientComponent,
    );

    if (clientModule) {
      clientBoundaries.push(clientModule.file);
    }
  }

  return clientBoundaries;
}

async function findClientBoundariesForClientBuild(serverEntries: string[]) {
  // Viteception
  const server = await createServer({
    clearScreen: false,
    server: {middlewareMode: 'ssr'},
  });

  try {
    // Load server entries to discover client components
    await Promise.all(serverEntries.map(server.ssrLoadModule));
  } catch (error) {
    error.message = 'Could not load server build entries: ' + error.message;
    throw error;
  }

  await server.close();

  return findClientBoundaries(server.moduleGraph);
}

const hashImportsPlugin = {
  name: 'vite-plugin-react-server-components-hash-imports',
  enforce: 'post',
  transform(code: string, id: string) {
    // Turn relative import paths to lossy hashes
    if (rscViteFileRE.test(id)) {
      const s = new MagicString(code);

      s.replace(
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

      return {
        code: s.toString(),
        map: s.generateMap({file: id, source: id}),
      };
    }
  },
};

// This can be used in custom findClientComponentsForClientBuild implementations
ReactFlightVitePlugin.findClientComponentsFromServer = findClientComponentsForDev;
