/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

type WebpackMap = {
  [filename: string]: ModuleMetaData,
};

export type BundlerConfig = WebpackMap;

// eslint-disable-next-line no-unused-vars
export type ModuleReference<T> = string;

export type ModuleMetaData = {
  id: string,
  chunks: Array<string>,
  name: string,
};

export function resolveModuleMetaData<T>(
  config: BundlerConfig,
  modulePath: ModuleReference<T>,
): ModuleMetaData {
  return config[modulePath];
}
