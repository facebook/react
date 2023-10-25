/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Request} from 'react-server/src/ReactFlightServer';

declare var $$$config: any;

export type ClientManifest = ?string;
export opaque type ClientReference<T> = mixed; // eslint-disable-line no-unused-vars
export opaque type ServerReference<T> = mixed; // eslint-disable-line no-unused-vars
export opaque type ClientReferenceMetadata: any = mixed;
export opaque type ServerReferenceId: any = mixed;
export opaque type ClientReferenceKey: any = mixed;
export const isClientReference = $$$config.isClientReference;
export const isServerReference = $$$config.isServerReference;
export const getClientReferenceKey = $$$config.getClientReferenceKey;
export const resolveClientReferenceMetadata =
  $$$config.resolveClientReferenceMetadata;
export const getServerReferenceId = $$$config.getServerReferenceId;
export const getServerReferenceBoundArguments =
  $$$config.getServerReferenceBoundArguments;
export const prepareHostDispatcher = $$$config.prepareHostDispatcher;

export * from 'react-dom-bindings/src/server/ReactFlightServerConfigDOM';

export const supportsRequestStorage = false;
export const requestStorage: AsyncLocalStorage<Request> = (null: any);
