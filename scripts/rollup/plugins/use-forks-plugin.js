/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const path = require('path');

let resolveCache = new Map();
function useForks(forks) {
  let resolvedForks = {};
  Object.keys(forks).forEach(srcModule => {
    const targetModule = forks[srcModule];
    resolvedForks[require.resolve(srcModule)] = require.resolve(targetModule);
  });
  return {
    resolveId(importee, importer) {
      if (!importer || !importee) {
        return null;
      }
      let resolvedImportee = null;
      let cacheKey = `${importer}:::${importee}`;
      if (resolveCache.has(cacheKey)) {
        // Avoid hitting file system if possible.
        resolvedImportee = resolveCache.get(cacheKey);
      } else {
        try {
          resolvedImportee = require.resolve(importee, {
            paths: [path.dirname(importer)],
          });
        } catch (err) {
          // Not our fault, let Rollup fail later.
        }
        if (resolvedImportee) {
          resolveCache.set(cacheKey, resolvedImportee);
        }
      }
      if (resolvedImportee && resolvedForks.hasOwnProperty(resolvedImportee)) {
        // We found a fork!
        return resolvedForks[resolvedImportee];
      }
      return null;
    },
  };
}

module.exports = useForks;
