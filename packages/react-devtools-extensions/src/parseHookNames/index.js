/* global chrome */

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// This file uses workerize to load ./parseHookNames.worker as a webworker and instanciates it,
// exposing flow typed functions that can be used on other files.

import * as parseHookNamesModule from './parseHookNames';
import WorkerizedParseHookNames from './parseHookNames.worker';

type ParseHookNamesModule = typeof parseHookNamesModule;

// $FlowFixMe
const wasmMappingsURL = chrome.extension.getURL('mappings.wasm');

const workerizedParseHookNames: ParseHookNamesModule = window.Worker
  ? WorkerizedParseHookNames()
  : parseHookNamesModule;

type ParseHookNames = $PropertyType<ParseHookNamesModule, 'parseHookNames'>;

export const parseHookNames: ParseHookNames = hooksTree =>
  workerizedParseHookNames.parseHookNames(hooksTree, wasmMappingsURL);

export const purgeCachedMetadata = workerizedParseHookNames.purgeCachedMetadata;
