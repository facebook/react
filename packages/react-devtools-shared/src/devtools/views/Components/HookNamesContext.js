// @flow

import {createContext} from 'react';
import type {
  FetchFileWithCaching,
  LoadHookNamesFunction,
  PrefetchSourceFiles,
  PurgeCachedHookNamesMetadata,
} from '../DevTools';

export type Context = {
  fetchFileWithCaching: FetchFileWithCaching | null,
  loadHookNames: LoadHookNamesFunction | null,
  prefetchSourceFiles: PrefetchSourceFiles | null,
  purgeCachedMetadata: PurgeCachedHookNamesMetadata | null,
};

const HookNamesContext = createContext<Context>({
  fetchFileWithCaching: null,
  loadHookNames: null,
  prefetchSourceFiles: null,
  purgeCachedMetadata: null,
});
HookNamesContext.displayName = 'HookNamesContext';

export default HookNamesContext;
