// @flow

import {createContext} from 'react';

export type FetchFileWithCaching = (url: string) => Promise<string>;
export type Context = FetchFileWithCaching | null;

const FetchFileWithCachingContext = createContext<Context>(null);
FetchFileWithCachingContext.displayName = 'FetchFileWithCachingContext';

export default FetchFileWithCachingContext;
