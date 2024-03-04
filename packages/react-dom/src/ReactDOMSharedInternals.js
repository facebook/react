/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {HostDispatcher} from './shared/ReactDOMTypes';
import type {EventPriority} from 'react-reconciler/src/ReactEventPriorities';

import {NoEventPriority} from 'react-reconciler/src/ReactEventPriorities';

type InternalsType = {
  usingClientEntryPoint: boolean,
  Events: [any, any, any, any, any, any],
  ReactDOMCurrentDispatcher: {
    current: HostDispatcher,
  },
  ReactDOMCurrentEventConfig: {
    eventPriority: EventPriority,
  },
};

function noop() {}

const DefaultDispatcher: HostDispatcher = {
  flushSyncWork: noop,
  prefetchDNS: noop,
  preconnect: noop,
  preload: noop,
  preloadModule: noop,
  preinitScript: noop,
  preinitStyle: noop,
  preinitModuleScript: noop,
};

const Internals: InternalsType = ({
  usingClientEntryPoint: false,
  Events: null,
  ReactDOMCurrentDispatcher: {
    current: DefaultDispatcher,
  },
  ReactDOMCurrentEventConfig: {
    eventPriority: NoEventPriority,
  },
}: any);

export default Internals;
