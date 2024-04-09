/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactClientValue} from 'react-server/src/ReactFlightServer';

import type {ClientManifest, ServerReference} from './ReactFlightReferencesFB';

export type {
  ClientManifest,
  ClientReference,
  ClientReferenceKey,
  ClientReferenceMetadata,
  ServerReference,
  ServerReferenceId,
} from './ReactFlightReferencesFB';

export {
  getClientReferenceKey,
  isClientReference,
  resolveClientReferenceMetadata,
  isServerReference,
  getServerReferenceId,
} from './ReactFlightReferencesFB';

export function getServerReferenceBoundArguments<T>(
  config: ClientManifest,
  serverReference: ServerReference<T>,
): null | Array<ReactClientValue> {
  throw new Error('getServerReferenceBoundArguments: Not Implemented.');
}
