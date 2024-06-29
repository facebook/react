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

import type {
  BrowserTheme,
  Wall,
} from 'react-devtools-shared/src/frontend/types';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type {
  ViewAttributeSource,
  ViewElementSource,
  CanViewElementSource,
} from 'react-devtools-shared/src/devtools/views/DevTools';
import type {Config} from 'react-devtools-shared/src/devtools/store';

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
    supportsClickToInspect: true,
    ...config,
  });
}

type InitializationOptions = {
  bridge: FrontendBridge,
  store: Store,
  theme?: BrowserTheme,
  viewAttributeSourceFunction?: ViewAttributeSource,
  viewElementSourceFunction?: ViewElementSource,
  canViewElementSourceFunction?: CanViewElementSource,
};

export function initialize(
  contentWindow: Element | Document,
  options: InitializationOptions,
): void {
  const {
    bridge,
    store,
    theme = 'light',
    viewAttributeSourceFunction,
    viewElementSourceFunction,
    canViewElementSourceFunction,
  } = options;
  const root = createRoot(contentWindow);

  root.render(
    <DevTools
      bridge={bridge}
      browserTheme={theme}
      store={store}
      showTabBar={true}
      warnIfLegacyBackendDetected={true}
      enabledInspectedElementContextMenu={true}
      viewAttributeSourceFunction={viewAttributeSourceFunction}
      viewElementSourceFunction={viewElementSourceFunction}
      canViewElementSourceFunction={canViewElementSourceFunction}
    />,
  );
}
