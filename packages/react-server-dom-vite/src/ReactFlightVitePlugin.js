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
  optimizeBoundaries: boolean | 'build',
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
  optimizeBoundaries = 'build',
  isServerComponentImporterAllowed = importer => false,
}: PluginOptions = {}) {
  let config;
  let server;
  let resolveAlias;
  let globImporterPath;
  const allClientBoundaries = new Set();

  function invalidateGlobImporter() {
    if (globImporterPath && server) {
      server.watcher.emit('change', globImporterPath);
    }
  }

  return {
    name: 'vite-plugin-react-server-components',
    enforce: 'pre',
    buildStart() {
      // Let other plugins differentiate between pure SSR and RSC builds
      if (config?.build?.ssr) process.env.VITE_RSC_BUILD = 'true';
    },
    buildEnd() {
      if (config?.build?.ssr) delete process.env.VITE_RSC_BUILD;
    },
    configureServer(_server: any) {
      server = _server;

      const seenModules = {};
      server.ws.on('rsc:cc404', data => {
        if (!seenModules[data.id]) {
          seenModules[data.id] = true;
          invalidateGlobImporter();
        }
      });
    },

    async configResolved(_config: any) {
      await init;
      config = _config;

      const aliasPlugin = config.plugins.find(
        plugin => plugin.name === 'alias',
      );

      if (aliasPlugin) {
        resolveAlias = aliasPlugin.resolveId.bind({
          // Mock Rollup instance
          resolve: id => ({then: () => (id ? {id} : null)}),
        });
      }

      // By pushing this plugin at the end of the existing array,
      // we enforce running it *after* Vite resolves import.meta.glob.
      config.plugins.push(hashImportsPlugin);
    },

    resolveId(source: string, importer: string) {
      if (!importer) return null;

      if (noProxyRE.test(source)) {
        const [id, query] = source.split('?');
        return this.resolve(id, importer, {skipSelf: true}).then(result => {
          if (!result) return null;
          return {
            ...result,
            id: result.id + (query ? `?${query}` : ''),
            moduleSideEffects: false,
          };
        });
      }

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

          // Invalidate glob importer file to account for the
          // newly discovered client component.
          invalidateGlobImporter();
        }
      }

      return proxyClientComponent(id.split('?')[0]);
    },

    transform(code: string, id: string, options: {ssr?: boolean} = {}) {
      // Add more information for this module in the graph.
      // It will be used later to discover client boundaries.
      if (server && options.ssr && /\.[jt]sx?($|\?)/.test(id)) {
        augmentModuleGraph(
          server.moduleGraph,
          id,
          code,
          config.root,
          resolveAlias,
        );
      }

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
                `\n/* HASH_BEGIN */ ` +
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

          // When mixing client and server components from the same
          // facade file, the module graph can break and miss certain
          // import connections (bug in Vite?) due to HMR. Instead of
          // creating a new list of discovered components from scratch,
          // reuse the already discovered ones and simply add new ones
          // to the list without removing anything.
          findClientBoundaries(
            server.moduleGraph,
            optimizeBoundaries === true,
          ).forEach(boundary => allClientBoundaries.add(boundary));

          return injectGlobs(Array.from(allClientBoundaries));
        }

        if (!serverBuildEntries) {
          throw new Error(
            '[react-server-dom-vite] Parameter serverBuildEntries is required for client build',
          );
        }

        return findClientBoundariesForClientBuild(
          serverBuildEntries,
          optimizeBoundaries !== false,
          config.root,
        ).then(injectGlobs);
      }
    },

    handleHotUpdate({modules}) {
      if (modules.some(mod => mod.meta && mod.meta.isClientComponent)) {
        return modules.filter(mod => !mod.meta || !mod.meta.ssr);
      }

      return modules;
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
    } /* @__PURE__ */wrapInClientProxy({ name: '${componentName}', id: '${getComponentId(
      filepath,
    )}', value: allImports['${key}'], isDefault: ${
      // eslint-disable-next-line react-internal/safe-string-coercion
      String(isDefault)
    } });\n`;
  });

  return {code: proxyCode, moduleSideEffects: false};
}

function findClientBoundaries(moduleGraph: any, optimizeBoundaries = false) {
  const clientBoundaries = [];

  // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  for (const set of moduleGraph.fileToModulesMap.values()) {
    const clientModule = Array.from(set).find(
      moduleNode => moduleNode.meta && moduleNode.meta.isClientComponent,
    );

    if (
      clientModule &&
      (!optimizeBoundaries || isDirectImportInServer(clientModule))
    ) {
      clientBoundaries.push(clientModule.file);
    }
  }

  return clientBoundaries;
}

async function findClientBoundariesForClientBuild(
  serverEntries: string[],
  optimizeBoundaries: boolean,
  root: string,
) {
  // Viteception
  const server = await createServer({
    root,
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

  return findClientBoundaries(server.moduleGraph, optimizeBoundaries);
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

type ModuleMeta = {
  isFacade: boolean,
  namedExports: string[],
  imports: Array<{
    action: 'import' | 'export',
    variables: Array<[string] | [string, string]>,
    from: string,
    originalFrom: string,
  }>,
};

type ViteModule = {
  id: string,
  file: string,
  meta: ?ModuleMeta,
  importers: ?Set<ViteModule>,
  [key: string]: any,
};

/**
 * A client module should behave as a client boundary
 * if it is imported by the server before encountering
 * another boundary in the process.
 * This traverses the module graph upwards to find non client
 * components that import the `originalMod`.
 *
 * The `accModInfo` represents the exported members from the
 * `originalMod` but renamed accordingly to all the intermediate/facade
 * files in the import chain from the `originalMod` to every parent importer.
 */
function isDirectImportInServer(
  originalMod: ViteModule,
  currentMod: ViteModule,
  accModInfo: ?{file: string, exports: string[]},
) {
  // TODO: this should use recursion in any module that exports
  // the original one, not only in full facade files.
  if (!currentMod || (currentMod.meta || {}).isFacade) {
    if (!accModInfo && originalMod.meta && originalMod.meta.namedExports) {
      // First iteration in the recursion, initialize the
      // acumulator with data from the original module.
      accModInfo = {
        file: originalMod.file,
        exports: originalMod.meta.namedExports,
      };
    }

    if (currentMod && accModInfo) {
      // Update accumulator in subsequent iterations with
      // whatever the current module is re-exporting.

      const lastModExports = accModInfo.exports;
      const lastModImports = currentMod.meta.imports.filter(
        importMeta =>
          importMeta.action === 'export' && importMeta.from === accModInfo.file,
      );

      accModInfo = {file: currentMod.file, exports: []};
      lastModImports.forEach(mod => {
        mod.variables.forEach(([name, alias]) => {
          if (name === '*' && !alias) {
            accModInfo.exports.push(...lastModExports);
          } else {
            accModInfo.exports.push(alias || name);
          }
        });
      });
    }

    return Array.from((currentMod || originalMod).importers || []).some(
      importer =>
        // eslint-disable-next-line no-unused-vars
        isDirectImportInServer(originalMod, importer, accModInfo),
    );
  }

  // Not enough information: safer to assume it is
  // imported in server to create a new boundary.
  if (!currentMod.meta || !originalMod.meta) return true;

  // If current module is a client component, stop checking
  // parents since this can be the actual boundary.
  if (isClientComponent(currentMod.file)) return false;

  // If current module is not a client component, assume
  // it is a server component on a shared component
  // that will be imported in the server to be safe.
  // However, due to the lack of tree-shaking in the dev module graph,
  // we need to manually make sure this module is importing something from
  // the original module before marking it as client boundary.
  return currentMod.meta.imports.some(
    imp =>
      imp.from === accModInfo.file &&
      (imp.variables || []).some(([name]) => accModInfo.exports.includes(name)),
  );
}

const RESOLVE_EXTENSIONS = [
  '',
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '/index',
  '/index.js',
  '/index.ts',
  '/index.jsx',
  '/index.tsx',
];

// Resolve relative paths  and aliases. Examples:
// - import {XYZ} from '~/components' => import {XYZ} from '<absolute>/src/components/index.ts'
// - import {XYZ} from '/src/component.client' => import {XYZ} from '<absolute>/src/component.client.jsx'`
function resolveModPath(modPath: string, dirname: string) {
  const extensions = /\.[jt]sx?$/.test(modPath) ? [''] : RESOLVE_EXTENSIONS;

  for (let i = 0; i < extensions.length; i++) {
    const extension = extensions[i];

    try {
      const absolutePath = modPath.startsWith('.')
        ? normalizePath(path.resolve(dirname, modPath))
        : modPath;

      return normalizePath(require.resolve(absolutePath + extension));
    } catch (error) {
      // Do not throw, this is likely a virtual module or another exception
    }
  }
}

function augmentModuleGraph(
  moduleGraph: any,
  id: string,
  code: string,
  root: string,
  resolveAlias: any,
) {
  const currentModule = moduleGraph.getModuleById(id);
  if (!currentModule) return;

  const [source] = id.split('?');
  const dirname = normalizePath(path.dirname(source));
  const [rawImports, namedExports, isFacade] = parse(code);

  // This is currently not used but it should be considered
  // to improve the crawling in `isDirectImportInServer`.
  const imports = [];
  rawImports.forEach(
    ({
      s: startMod,
      e: endMod,
      d: dynamicImportIndex,
      ss: startStatement,
      se: endStatement,
    }) => {
      if (dynamicImportIndex !== -1) return; // Skip dynamic imports for now

      const rawModPath = code.slice(startMod, endMod);
      let modPath = rawModPath.split('?')[0];

      if (resolveAlias) {
        const resolvedAliasPath = resolveAlias(modPath, 'rsc_importer', {});
        if (resolvedAliasPath && resolvedAliasPath.id) {
          modPath = resolvedAliasPath.id;
        }
      }

      if (modPath && modPath.startsWith('/src/')) {
        // Vite default alias
        modPath = normalizePath(path.join(root, modPath));
      }

      const resolvedPath = resolveModPath(modPath, dirname);
      if (!resolvedPath) return; // Virtual modules or other exceptions

      const [action, variables = ''] = code
        .slice(startStatement, endStatement)
        .split(/\s+(from\s+)?['"]/m)[0]
        .split(/\s+(.+)/m);

      imports.push({
        action, // 'import' or 'export'
        variables: variables // [['originalName', 'alias']]
          .trim()
          .replace(/^[^{*]/, 'default as $&')
          .replace(/[{}]/gm, '')
          .trim()
          .split(/\s*,\s*/m)
          .filter(Boolean)
          .map(s => s.split(/\s+as\s+/m)),
        from: resolvedPath, // '/absolute/path'
        originalFrom: rawModPath, // './path' or '3plib/subpath'
      });
    },
  );

  if (!currentModule.meta) {
    currentModule.meta = {};
  }

  Object.assign(currentModule.meta, {
    isFacade,
    namedExports,
    imports,
    ssr: true,
  });
}
