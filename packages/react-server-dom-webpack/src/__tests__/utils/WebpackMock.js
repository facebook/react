/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const url = require('url');
const Module = require('module');

let webpackModuleIdx = 0;
const webpackModules = {};
const webpackErroredModules = {};
const webpackMap = {};
global.__webpack_require__ = function(id) {
  if (webpackErroredModules[id]) {
    throw webpackErroredModules[id];
  }
  return webpackModules[id];
};

const previousLoader = Module._extensions['.client.js'];

const register = require('react-server-dom-webpack/node-register');
// Register node loader
register();

const nodeLoader = Module._extensions['.client.js'];

if (previousLoader === nodeLoader) {
  throw new Error(
    'Expected the Node loader to register the .client.js extension',
  );
}

Module._extensions['.client.js'] = previousLoader;

exports.webpackMap = webpackMap;
exports.webpackModules = webpackModules;

exports.clientModuleError = function clientModuleError(moduleError) {
  const idx = '' + webpackModuleIdx++;
  webpackErroredModules[idx] = moduleError;
  const path = url.pathToFileURL(idx).href;
  webpackMap[path] = {
    '': {
      id: idx,
      chunks: [],
      name: '',
    },
    '*': {
      id: idx,
      chunks: [],
      name: '*',
    },
  };
  const mod = {exports: {}};
  nodeLoader(mod, idx);
  return mod.exports;
};

exports.clientExports = function clientExports(moduleExports) {
  const idx = '' + webpackModuleIdx++;
  webpackModules[idx] = moduleExports;
  const path = url.pathToFileURL(idx).href;
  webpackMap[path] = {
    '': {
      id: idx,
      chunks: [],
      name: '',
    },
    '*': {
      id: idx,
      chunks: [],
      name: '*',
    },
  };
  if (typeof moduleExports.then === 'function') {
    moduleExports.then(
      asyncModuleExports => {
        for (const name in asyncModuleExports) {
          webpackMap[path] = {
            [name]: {
              id: idx,
              chunks: [],
              name: name,
            },
          };
        }
      },
      () => {},
    );
  }
  for (const name in moduleExports) {
    webpackMap[path] = {
      [name]: {
        id: idx,
        chunks: [],
        name: name,
      },
    };
  }
  const mod = {exports: {}};
  nodeLoader(mod, idx);
  return mod.exports;
};
