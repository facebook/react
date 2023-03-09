/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

declare var $$$hostConfig: any;

export opaque type ClientManifest = mixed;
export opaque type ClientReference<T> = mixed; // eslint-disable-line no-unused-vars
export opaque type ServerReference<T> = mixed; // eslint-disable-line no-unused-vars
export opaque type ClientReferenceMetadata: any = mixed;
export opaque type ServerReferenceId: any = mixed;
export opaque type ClientReferenceKey: any = mixed;
export const isClientReference = $$$hostConfig.isClientReference;
export const isServerReference = $$$hostConfig.isServerReference;
export const getClientReferenceKey = $$$hostConfig.getClientReferenceKey;
export const resolveClientReferenceMetadata =
  $$$hostConfig.resolveClientReferenceMetadata;
export const getServerReferenceId = $$$hostConfig.getServerReferenceId;
export const getServerReferenceBoundArguments =
  $$$hostConfig.getServerReferenceBoundArguments;
