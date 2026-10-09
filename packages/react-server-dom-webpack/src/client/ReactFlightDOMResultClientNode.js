/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes';
import type {Result} from 'shared/ReactFlightResult';
import type {ClientManifest} from '../server/ReactFlightServerConfigWebpackBundler';
import type {
  ServerConsumerModuleMap,
  ModuleLoading,
  ServerManifest,
} from 'react-client/src/ReactFlightClientConfig';
import {
  createResponse,
  readResult,
} from 'react-client/src/ReactFlightResultClient';

type Options = {
  clientManifest: ClientManifest,
  serverConsumerManifest: {
    moduleMap: ServerConsumerModuleMap,
    moduleLoading: ModuleLoading,
    serverModuleMap: null | ServerManifest,
  },
};

export function createFromResult<T>(
  result: Result<T>,
  options: Options,
): Thenable<T> {
  const response = createResponse();
  return readResult(response, result);
}
