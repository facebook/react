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

import WorkerizedParseHookNames from './parseHookNames.worker';
import typeof * as ParseHookNamesModule from './parseHookNames';

const workerizedParseHookNames: ParseHookNamesModule = WorkerizedParseHookNames();

type ParseHookNames = $PropertyType<ParseHookNamesModule, 'parseHookNames'>;

export const parseHookNames: ParseHookNames = hooksTree =>
  workerizedParseHookNames.parseHookNames(hooksTree);

export const purgeCachedMetadata = workerizedParseHookNames.purgeCachedMetadata;
