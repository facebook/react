/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

declare var globalThis: any;

export type BundlerConfig = {};

// eslint-disable-next-line no-unused-vars
export type ModuleReference<T> = {
  $$typeof: Symbol,
  filepath: string,
  name: string,
};

export type ModuleMetaData = {
  id: string,
  name: string,
};

export type ModuleKey = string;

const MODULE_TAG = Symbol.for('react.module.reference');

export function getModuleKey(reference: ModuleReference<any>): ModuleKey {
  if (typeof reference === 'string')
    reference = globalThis.__STRING_REFERENCE_INDEX[reference];

  return reference.filepath + '#' + reference.name;
}

export function isModuleReference(reference: Object): boolean {
  if (typeof reference === 'string')
    return !!globalThis.__STRING_REFERENCE_INDEX[reference];

  return reference.$$typeof === MODULE_TAG;
}

export function resolveModuleMetaData<T>(
  config: BundlerConfig,
  moduleReference: ModuleReference<T>,
): ModuleMetaData {
  if (typeof moduleReference === 'string')
    moduleReference = globalThis.__STRING_REFERENCE_INDEX[moduleReference];

  return {
    id: moduleReference.filepath,
    name: moduleReference.name,
  };
}
