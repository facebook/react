/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

type WebpackMap = {
  [filepath: string]: {
    [name: string]: ModuleMetaData,
  },
};

export type BundlerConfig = WebpackMap;

// eslint-disable-next-line no-unused-vars
export type ModuleReference<T> = {
  $$typeof: Symbol,
  filepath: string,
  name: string,
};

export type ModuleMetaData = {
  id: string,
  chunks: Array<string>,
  name: string,
};

export type ModuleKey = string;

const MODULE_TAG = Symbol.for('react.module.reference');

export function getModuleKey(reference: ModuleReference<any>): ModuleKey {
  return reference.filepath + '#' + reference.name;
}

export function isModuleReference(reference: Object): boolean {
  return reference.$$typeof === MODULE_TAG;
}

export function resolveModuleMetaData<T>(
  config: BundlerConfig,
  moduleReference: ModuleReference<T>,
): ModuleMetaData {
  return config[moduleReference.filepath][moduleReference.name];
}
