/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {canUseDOM} from 'shared/ExecutionEnvironment';
import {useSyncExternalStore as client} from './useSyncExternalStoreClient';
import {useSyncExternalStore as server} from './useSyncExternalStoreServer';
import * as React from 'react';

const {unstable_useSyncExternalStore: builtInAPI} = React;

export const useSyncExternalStore =
  builtInAPI !== undefined
    ? ((builtInAPI: any): typeof client)
    : canUseDOM
    ? client
    : server;
