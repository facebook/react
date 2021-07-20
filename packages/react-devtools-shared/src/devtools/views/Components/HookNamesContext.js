// @flow

import {createContext} from 'react';
import type {
  LoadHookNamesFunction,
  PurgeCachedHookNamesMetadata,
} from '../DevTools';

export type Context = {
  loadHookNames: LoadHookNamesFunction | null,
  purgeCachedMetadata: PurgeCachedHookNamesMetadata | null,
};

const HookNamesContext = createContext<Context>({
  loadHookNames: null,
  purgeCachedMetadata: null,
});
HookNamesContext.displayName = 'HookNamesContext';

export default HookNamesContext;
