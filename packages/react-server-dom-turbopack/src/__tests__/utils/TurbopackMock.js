/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const url = require('url');
const Module = require('module');

let turbopackModuleIdx = 0;
const turbopackServerModules = {};
const turbopackClientModules = {};
const turbopackErroredModules = {};
const turbopackServerMap = {};
const turbopackClientMap = {};
global.__turbopack_require__ = function (id) {
  if (turbopackErroredModules[id]) {
    throw turbopackErroredModules[id];
  }
  return turbopackClientModules[id] || turbopackServerModules[id];
};

const previousCompile = Module.prototype._compile;

const register = require('react-server-dom-turbopack/node-register');
// Register node compile
register();

const nodeCompile = Module.prototype._compile;

if (previousCompile === nodeCompile) {
  throw new Error(
    'Expected the Node loader to register the _compile extension',
  );
}

Module.prototype._compile = previousCompile;

exports.turbopackMap = turbopackClientMap;
exports.turbopackModules = turbopackClientModules;
exports.turbopackServerMap = turbopackServerMap;
exports.moduleLoading = {
  prefix: '/prefix/',
};

exports.clientModuleError = function clientModuleError(moduleError) {
  const idx = '' + turbopackModuleIdx++;
  turbopackErroredModules[idx] = moduleError;
  const path = url.pathToFileURL(idx).href;
  turbopackClientMap[path] = {
    id: idx,
    chunks: [],
    name: '*',
  };
  const mod = {exports: {}};
  nodeCompile.call(mod, '"use client"', idx);
  return mod.exports;
};

exports.clientExports = function clientExports(moduleExports, chunkUrl) {
  const chunks = [];
  if (chunkUrl !== undefined) {
    chunks.push(chunkUrl);
  }
  const idx = '' + turbopackModuleIdx++;
  turbopackClientModules[idx] = moduleExports;
  const path = url.pathToFileURL(idx).href;
  turbopackClientMap[path] = {
    id: idx,
    chunks,
    name: '*',
  };
  // We only add this if this test is testing ESM compat.
  if ('__esModule' in moduleExports) {
    turbopackClientMap[path + '#'] = {
      id: idx,
      chunks,
      name: '',
    };
  }
  if (typeof moduleExports.then === 'function') {
    moduleExports.then(
      asyncModuleExports => {
        for (const name in asyncModuleExports) {
          turbopackClientMap[path + '#' + name] = {
            id: idx,
            chunks,
            name: name,
          };
        }
      },
      () => {},
    );
  }
  if ('split' in moduleExports) {
    // If we're testing module splitting, we encode this name in a separate module id.
    const splitIdx = '' + turbopackModuleIdx++;
    turbopackClientModules[splitIdx] = {
      s: moduleExports.split,
    };
    turbopackClientMap[path + '#split'] = {
      id: splitIdx,
      chunks,
      name: 's',
    };
  }
  const mod = {exports: {}};
  nodeCompile.call(mod, '"use client"', idx);
  return mod.exports;
};

// This tests server to server references. There's another case of client to server references.
exports.serverExports = function serverExports(moduleExports) {
  const idx = '' + turbopackModuleIdx++;
  turbopackServerModules[idx] = moduleExports;
  const path = url.pathToFileURL(idx).href;
  turbopackServerMap[path] = {
    id: idx,
    chunks: [],
    name: '*',
  };
  // We only add this if this test is testing ESM compat.
  if ('__esModule' in moduleExports) {
    turbopackServerMap[path + '#'] = {
      id: idx,
      chunks: [],
      name: '',
    };
  }
  if ('split' in moduleExports) {
    // If we're testing module splitting, we encode this name in a separate module id.
    const splitIdx = '' + turbopackModuleIdx++;
    turbopackServerModules[splitIdx] = {
      s: moduleExports.split,
    };
    turbopackServerMap[path + '#split'] = {
      id: splitIdx,
      chunks: [],
      name: 's',
    };
  }
  const mod = {exports: moduleExports};
  nodeCompile.call(mod, '"use server"', idx);
  return mod.exports;
};
