/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

declare var $$$hostConfig: any;

export opaque type BundlerConfig = mixed;
export opaque type ClientReference<T> = mixed; // eslint-disable-line no-unused-vars
export opaque type ModuleMetaData: any = mixed;
export opaque type ClientReferenceKey: any = mixed;
export const isClientReference = $$$hostConfig.isClientReference;
export const getClientReferenceKey = $$$hostConfig.getClientReferenceKey;
export const resolveModuleMetaData = $$$hostConfig.resolveModuleMetaData;
