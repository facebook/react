/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const path = require('path');
const semver = require('semver');

function resolveRelatively(importee, importer) {
  if (semver.gte(process.version, '8.9.0')) {
    return require.resolve(importee, {
      paths: [path.dirname(importer)],
    });
  } else {
    // `paths` argument is not available in older Node.
    // This works though.
    // https://github.com/nodejs/node/issues/5963
    const Module = require('module');
    return Module._findPath(importee, [
      path.dirname(importer),
      ...module.paths,
    ]);
  }
}

let resolveCache = new Map();
function useForks(forks) {
  let resolvedForks = new Map();
  Object.keys(forks).forEach(srcModule => {
    // Fork paths are relative to the project root. They must include the full
    // path, including the extension. We intentionally don't use Node's module
    // resolution algorithm because 1) require.resolve doesn't work with ESM
    // modules, and 2) the behavior is easier to predict.
    const targetModule = forks[srcModule];
    resolvedForks.set(
      path.resolve(process.cwd(), srcModule),
      // targetModule could be a string (a file path),
      // or an error (which we'd throw if it gets used).
      // Don't try to "resolve" errors, but cache
      // resolved file paths.
      typeof targetModule === 'string'
        ? path.resolve(process.cwd(), targetModule)
        : targetModule
    );
  });
  return {
    name: 'scripts/rollup/plugins/use-forks-plugin',
    resolveId(importee, importer) {
      if (!importer || !importee) {
        return null;
      }
      if (importee.startsWith('\u0000')) {
        // Internal Rollup reference, ignore.
        // Passing that to Node file functions can fatal.
        return null;
      }
      let resolvedImportee = null;
      let cacheKey = `${importer}:::${importee}`;
      if (resolveCache.has(cacheKey)) {
        // Avoid hitting file system if possible.
        resolvedImportee = resolveCache.get(cacheKey);
      } else {
        try {
          resolvedImportee = resolveRelatively(importee, importer);
        } catch (err) {
          // Not our fault, let Rollup fail later.
        }
        if (resolvedImportee) {
          resolveCache.set(cacheKey, resolvedImportee);
        }
      }
      if (resolvedImportee && resolvedForks.has(resolvedImportee)) {
        // We found a fork!
        const fork = resolvedForks.get(resolvedImportee);
        if (fork instanceof Error) {
          throw fork;
        }
        return fork;
      }
      return null;
    },
  };
}

module.exports = useForks;
