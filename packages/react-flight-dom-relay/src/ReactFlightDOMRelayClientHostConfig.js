/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {JSONValue} from 'react-client/src/ReactFlightClient';

export {
  resolveModuleReference,
  preloadModule,
  requireModule,
} from 'ReactFlightDOMRelayClientIntegration';

export type {
  ModuleReference,
  ModuleMetaData,
} from 'ReactFlightDOMRelayClientIntegration';

export type UninitializedModel = JSONValue;
