// @flow

import { createContext } from 'react';

import type { TreeMetadataType } from '../types';

import Store from '../store';

export const RootsContext = createContext<Array<string>>([]);
export const StoreContext = createContext<Store>(((null: any): Store));
export const TreeContext = createContext<TreeMetadataType>(
  ((null: any): TreeMetadataType)
);
