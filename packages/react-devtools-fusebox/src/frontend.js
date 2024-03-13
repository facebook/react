/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {createRoot} from 'react-dom/client';
import Bridge from 'react-devtools-shared/src/bridge';
import Store from 'react-devtools-shared/src/devtools/store';
import DevTools from 'react-devtools-shared/src/devtools/views/DevTools';

import type {Wall} from 'react-devtools-shared/src/frontend/types';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';

type Config = {
  checkBridgeProtocolCompatibility?: boolean,
  supportsNativeInspection?: boolean,
  supportsProfiling?: boolean,
};

export function createBridge(wall?: Wall): FrontendBridge {
  if (wall != null) {
    return new Bridge(wall);
  }

  return new Bridge({listen: () => {}, send: () => {}});
}

export function createStore(bridge: FrontendBridge, config?: Config): Store {
  return new Store(bridge, {
    checkBridgeProtocolCompatibility: true,
    supportsTraceUpdates: true,
    supportsNativeInspection: true,
    ...config,
  });
}

type InitializationOptions = {
  bridge: FrontendBridge,
  store: Store,
};

export function initialize(
  contentWindow: Element | Document,
  options: InitializationOptions,
): void {
  const {bridge, store} = options;
  const root = createRoot(contentWindow);

  root.render(
    <DevTools
      bridge={bridge}
      store={store}
      showTabBar={true}
      warnIfLegacyBackendDetected={true}
    />,
  );
}
