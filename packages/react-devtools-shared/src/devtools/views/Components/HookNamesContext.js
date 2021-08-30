// @flow

import {createContext} from 'react';
import type {
  FetchFileWithCaching,
  LoadHookNamesFunction,
  PurgeCachedHookNamesMetadata,
} from '../DevTools';

export type Context = {
  fetchFileWithCaching: FetchFileWithCaching | null,
  loadHookNames: LoadHookNamesFunction | null,
  purgeCachedMetadata: PurgeCachedHookNamesMetadata | null,
};

const HookNamesContext = createContext<Context>({
  fetchFileWithCaching: null,
  loadHookNames: null,
  purgeCachedMetadata: null,
});
HookNamesContext.displayName = 'HookNamesContext';

export default HookNamesContext;
