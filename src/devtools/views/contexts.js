// @flow

import { createContext } from 'react';

import Store from '../store';

export const RootsContext = createContext<Array<string>>([]);
export const StoreContext = createContext<Store>(((null: any): Store));
