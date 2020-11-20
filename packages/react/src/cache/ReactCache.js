/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 * @flow
 */

import type {ReactContext} from 'shared/ReactTypes';

import * as React from 'react';

type Cache = {|
  resources: Map<any, any>,
|};

const ReactCurrentDispatcher =
  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
    .ReactCurrentDispatcher;

const CacheContext: ReactContext<null | Cache> = React.createContext(null);

function CacheImpl() {
  this.resources = new Map();
}

function createCache(): Cache {
  // $FlowFixMe
  return new CacheImpl();
}

function readCache(): Cache {
  return ReactCurrentDispatcher.current.readCache(CacheContext);
}

export {createCache, readCache, CacheContext};
