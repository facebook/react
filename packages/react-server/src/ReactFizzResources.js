/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Resources} from './ReactFizzConfig';

import {
  supportsRequestStorage,
  requestStorage2,
} from './ReactServerStreamConfig';

export function resolveResources(): null | Resources {
  if (currentResources) return currentResources;
  if (supportsRequestStorage) {
    const store = requestStorage2.getStore();
    return store || null;
  }
  return null;
}

let currentResources: null | Resources = null;

export function setCurrentResources(store: null | Resources): null | Resources {
  currentResources = store;
  return currentResources;
}

export function getCurrentResources(): null | Resources {
  return currentResources;
}
