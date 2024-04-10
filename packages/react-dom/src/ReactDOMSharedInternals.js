/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {EventPriority} from 'react-reconciler/src/ReactEventPriorities';
import type {HostDispatcher} from './shared/ReactDOMTypes';

import {NoEventPriority} from 'react-reconciler/src/ReactEventPriorities';

type ReactDOMInternals = {
  d /* ReactDOMCurrentDispatcher */: HostDispatcher,
  p /* currentUpdatePriority */: EventPriority,
  findDOMNode:
    | null
    | ((
        componentOrElement: React$Component<any, any>,
      ) => null | Element | Text),
  usingClientEntryPoint: boolean,
};

export type ReactDOMInternalsDev = ReactDOMInternals & {
  usingClientEntryPoint: boolean,
};

function noop() {}

const DefaultDispatcher: HostDispatcher = {
  f /* flushSyncWork */: noop,
  D /* prefetchDNS */: noop,
  C /* preconnect */: noop,
  L /* preload */: noop,
  m /* preloadModule */: noop,
  X /* preinitScript */: noop,
  S /* preinitStyle */: noop,
  M /* preinitModuleScript */: noop,
};

const Internals: ReactDOMInternals = {
  d /* ReactDOMCurrentDispatcher */: DefaultDispatcher,
  p /* currentUpdatePriority */: NoEventPriority,
  findDOMNode: null,
  usingClientEntryPoint: false,
};

export default Internals;
