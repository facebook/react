// @flow

import { createContext } from 'react';
import Store from '../store';

import type { FrontendBridge } from 'react-devtools-shared/src/bridge';

export const BridgeContext = createContext<FrontendBridge>(
  ((null: any): FrontendBridge)
);
BridgeContext.displayName = 'BridgeContext';

export const StoreContext = createContext<Store>(((null: any): Store));
StoreContext.displayName = 'StoreContext';
