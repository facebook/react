// @flow

import {createContext} from 'react';
import type {LoadHookNamesFunction} from '../DevTools';

export type Context = LoadHookNamesFunction | null;

const LoadHookNamesFunctionContext = createContext<Context>(null);
LoadHookNamesFunctionContext.displayName = 'LoadHookNamesFunctionContext';

export default LoadHookNamesFunctionContext;
