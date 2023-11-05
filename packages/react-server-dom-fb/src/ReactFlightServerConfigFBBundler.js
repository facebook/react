/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactClientValue} from 'react-server/src/ReactFlightServer';

import type {
  ClientManifest,
  ClientReference,
  ServerReference,
} from './ReactFlightReferencesFB';

export type {ClientReference, ServerReference};

export {
  ClientManifest,
  ClientReferenceKey,
  ClientReferenceMetadata,
  getClientReferenceKey,
  getServerReferenceId,
  isClientReference,
  isServerReference,
  resolveClientReferenceMetadata,
  ServerReferenceId,
} from './ReactFlightReferencesFB';

export function getServerReferenceBoundArguments<T>(
  config: ClientManifest,
  serverReference: ServerReference<T>,
): null | Array<ReactClientValue> {
  throw new Error('Not Implemented.');
}
