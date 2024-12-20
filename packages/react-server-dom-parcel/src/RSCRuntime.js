/**
 * MIT License
 *
 * Copyright (c) 2017-present Devon Govett
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
// @flow strict-local
/* eslint-disable no-for-of-loops/no-for-of-loops */
/* eslint-disable es/no-optional-chaining */

import {Runtime} from '@parcel/plugin';
import nullthrows from 'nullthrows';
import {urlJoin, normalizeSeparators} from '@parcel/utils';
import path from 'path';
import {hashString} from '@parcel/rust';

export default (new Runtime({
  async loadConfig({config, options}) {
    // This logic must be synced with the packager...
    const packageName = await config.getConfigFrom(
      options.projectRoot + '/index',
      [],
      {
        packageKey: 'name',
      },
    );

    const name = packageName?.contents ?? '';
    return {
      parcelRequireName: 'parcelRequire' + hashString(name).slice(-4),
    };
  },
  apply({bundle, bundleGraph, config}) {
    if (
      bundle.type !== 'js' ||
      (bundle.env.context !== 'react-server' &&
        bundle.env.context !== 'react-client')
    ) {
      return [];
    }

    const runtimes: Array<{
      filePath: string,
      code: any,
      dependency?: any,
      env?: {sourceType: 'module'},
      isEntry?: boolean,
      shouldReplaceResolution?: boolean,
    }> = [];
    bundle.traverse(node => {
      if (node.type === 'dependency') {
        const resolvedAsset = bundleGraph.getResolvedAsset(node.value, bundle);
        const directives = resolvedAsset?.meta?.directives;

        // Server dependency on a client component.
        if (
          node.value.env.isServer() &&
          resolvedAsset &&
          Array.isArray(directives) &&
          directives.includes('use client')
        ) {
          let browserBundles;
          const async = bundleGraph.resolveAsyncDependency(node.value, bundle);
          if (async?.type === 'bundle_group') {
            browserBundles = bundleGraph
              .getBundlesInBundleGroup(async.value)
              .filter(b => b.type === 'js' && b.env.isBrowser())
              .map(b => normalizeSeparators(b.name));
          } else {
            browserBundles = bundleGraph
              .getReferencedBundles(bundle)
              .filter(b => b.type === 'js' && b.env.isBrowser())
              .map(b => normalizeSeparators(b.name));
          }

          let code = `import {createClientReference} from "react-server-dom-parcel/server.edge";\n`;
          for (const symbol of bundleGraph.getExportedSymbols(
            resolvedAsset,
            bundle,
          )) {
            code += `exports[${JSON.stringify(
              symbol.exportAs,
            )}] = createClientReference(${JSON.stringify(
              bundleGraph.getAssetPublicId(symbol.asset),
            )}, ${JSON.stringify(symbol.exportSymbol)}, ${JSON.stringify(
              browserBundles,
            )});\n`;
          }

          code += `exports.__esModule = true;\n`;

          if (node.value.priority === 'lazy') {
            code += 'module.exports = Promise.resolve(exports);\n';
          }

          runtimes.push({
            filePath: replaceExtension(resolvedAsset.filePath),
            code,
            dependency: node.value,
            env: {sourceType: 'module'},
          });

          // Dependency on a server action.
        } else if (
          resolvedAsset &&
          Array.isArray(directives) &&
          directives.includes('use server')
        ) {
          let code;
          if (node.value.env.isServer()) {
            // Dependency on a "use server" module from a server environment.
            // Mark each export as a server reference that can be passed to a client component as a prop.
            code = `import {registerServerReference} from "react-server-dom-parcel/server.edge";\n`;
            const publicId = JSON.stringify(
              bundleGraph.getAssetPublicId(resolvedAsset),
            );
            code += `let originalModule = parcelRequire(${publicId});\n`;
            code += `for (let key in originalModule) {\n`;
            code += `  Object.defineProperty(exports, key, {\n`;
            code += `    enumerable: true,\n`;
            code += `    get: () => {\n`;
            code += `      let value = originalModule[key];\n`;
            code += `      if (typeof value === 'function' && !value.$$typeof) {\n`;
            code += `        registerServerReference(value, ${publicId}, key);\n`;
            code += `      }\n`;
            code += `      return value;\n`;
            code += `    }\n`;
            code += `  });\n`;
            code += `}\n`;
          } else {
            // Dependency on a "use server" module from a client environment.
            // Create a client proxy module that will call the server.
            code = `import {createServerReference} from "react-server-dom-parcel/client";\n`;
            let usedSymbols = bundleGraph.getUsedSymbols(resolvedAsset);
            if (usedSymbols?.has('*')) {
              usedSymbols = null;
            }
            for (const symbol of bundleGraph.getExportedSymbols(
              resolvedAsset,
              bundle,
            )) {
              if (usedSymbols && !usedSymbols.has(symbol.exportAs)) {
                continue;
              }
              code += `exports[${JSON.stringify(
                symbol.exportAs,
              )}] = createServerReference(${JSON.stringify(
                bundleGraph.getAssetPublicId(symbol.asset),
              )}, ${JSON.stringify(symbol.exportSymbol)});\n`;
            }
          }

          code += `exports.__esModule = true;\n`;
          if (node.value.priority === 'lazy') {
            code += 'module.exports = Promise.resolve(exports);\n';
          }

          runtimes.push({
            filePath: replaceExtension(resolvedAsset.filePath),
            code,
            dependency: node.value,
            env: {sourceType: 'module'},
            shouldReplaceResolution: true,
          });

          // Server dependency on a client entry.
        } else if (
          node.value.env.isServer() &&
          resolvedAsset &&
          Array.isArray(directives) &&
          directives.includes('use client-entry')
        ) {
          // Resolve to an empty module so the client entry does not run on the server.
          runtimes.push({
            filePath: replaceExtension(resolvedAsset.filePath),
            code: '',
            dependency: node.value,
            env: {sourceType: 'module'},
          });

          // Dependency on a Resources component.
        } else if (node.value.specifier === 'react-server-dom-parcel/runtime') {
          // Generate a component that renders link tags for stylesheets referenced by the bundle.
          const bundles = bundleGraph.getReferencedBundles(bundle);
          let code =
            'import React from "react";\nexport function Resources() {\n  return <>\n';
          let entry;
          let imports = '';
          for (const b of bundles) {
            if (!b.env.isBrowser()) {
              continue;
            }
            const url = urlJoin(b.target.publicUrl, b.name);
            if (b.type === 'css') {
              code += `<link rel="stylesheet" href=${JSON.stringify(
                url,
              )} precedence="default" />\n`;
            } else if (b.type === 'js') {
              imports += `import ${JSON.stringify(url)};`;
            }
            b.traverseAssets((a, ctx, actions) => {
              if (
                Array.isArray(a.meta.directives) &&
                a.meta.directives.includes('use client-entry')
              ) {
                entry = a;
                actions.stop();
              }
            });
          }

          // React will insert async script tags for client components to preinit them asap.
          // Add an inline script element to bootstrap the page, by calling parcelRequire for the client-entry module.
          // We use import statements to wait for the dependent bundles to load.
          if (entry) {
            code += `<script type="module">${imports}${
              nullthrows(config).parcelRequireName
            }(${JSON.stringify(
              bundleGraph.getAssetPublicId(entry),
            )})</script>\n`;
          }

          code += '</>;\n}\n';

          const filePath = nullthrows(node.value.sourcePath);
          runtimes.push({
            filePath: replaceExtension(filePath),
            code,
            dependency: node.value,
            env: {sourceType: 'module'},
            shouldReplaceResolution: true,
          });
        }
      }
    });

    // Register server actions in the server entry point.
    if (
      bundle.env.isServer() &&
      bundleGraph.getParentBundles(bundle).length === 0
    ) {
      let serverActions = '';
      bundleGraph.traverse(node => {
        if (
          node.type === 'asset' &&
          Array.isArray(node.value.meta?.directives) &&
          node.value.meta.directives.includes('use server')
        ) {
          const bundlesWithAsset = bundleGraph.getBundlesWithAsset(node.value);
          const bundles: Set<any> = new Set();
          const referenced = bundleGraph.getReferencedBundles(
            bundlesWithAsset[0],
          );
          bundles.add(normalizeSeparators(bundlesWithAsset[0].name));
          for (const r of referenced) {
            if (r.type === 'js' && r.env.context === bundle.env.context) {
              bundles.add(normalizeSeparators(r.name));
            }
          }
          serverActions += `  ${JSON.stringify(
            bundleGraph.getAssetPublicId(node.value),
          )}: ${JSON.stringify([...bundles])},\n`;
        }
      });

      let code = '';
      if (serverActions.length > 0) {
        code +=
          'import {registerServerActions} from "react-server-dom-parcel/server.edge";\n';
        code += `registerServerActions({\n`;
        code += serverActions;
        code += '});\n';
      }

      // React needs AsyncLocalStorage defined as a global for the edge environment.
      // Without this, preinit scripts won't be inserted during SSR.
      code += 'if (typeof AsyncLocalHooks === "undefined") {\n';
      code += '  try {\n';
      code +=
        '    globalThis.AsyncLocalStorage = require("node:async_hooks").AsyncLocalStorage;\n';
      code += '  } catch {}\n';
      code += '}\n';

      runtimes.push({
        filePath: replaceExtension(
          bundle.getMainEntry()?.filePath ?? __filename,
        ),
        code,
        isEntry: true,
        env: {sourceType: 'module'},
      });
    }

    return runtimes;
  },
}): Runtime);

function replaceExtension(filePath: string, extension: string = '.jsx') {
  const ext = path.extname(filePath);
  return filePath.slice(0, -ext.length) + extension;
}
