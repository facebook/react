// @flow

import { createContext } from 'react';

import type { TreeMetadataType } from '../types';

import Store from '../store';

export const StoreContext = createContext<Store>(((null: any): Store));
// $FlowFixMe displayName is a valid attribute of React$Context
StoreContext.displayName = 'StoreContext';

export const TreeContext = createContext<TreeMetadataType>(
  ((null: any): TreeMetadataType)
);
// $FlowFixMe displayName is a valid attribute of React$Context
TreeContext.displayName = 'TreeMetadataContext';
