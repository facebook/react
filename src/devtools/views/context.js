// @flow

import { createContext } from 'react';

import type { Bridge } from '../../types';
import type { TreeMetadataType } from '../types';

import Store from '../store';

export const BridgeContext = createContext<Bridge>(((null: any): Bridge));
// $FlowFixMe displayName is a valid attribute of React$Context
BridgeContext.displayName = 'BridgeContext';

export const StoreContext = createContext<Store>(((null: any): Store));
// $FlowFixMe displayName is a valid attribute of React$Context
StoreContext.displayName = 'StoreContext';

export const TreeContext = createContext<TreeMetadataType>(
  ((null: any): TreeMetadataType)
);
// $FlowFixMe displayName is a valid attribute of React$Context
TreeContext.displayName = 'TreeMetadataContext';
