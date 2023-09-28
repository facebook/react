/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

interface Reference {}

type TaintEntry = {
  message: string,
  count: number,
};

export const TaintRegistryObjects: WeakMap<Reference, string> = new WeakMap();
export const TaintRegistryValues: Map<string | bigint, TaintEntry> = new Map();
