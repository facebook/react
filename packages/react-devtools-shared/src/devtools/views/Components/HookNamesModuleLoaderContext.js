/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Thenable} from 'shared/ReactTypes';

import {createContext} from 'react';
import typeof * as ParseHookNamesModule from 'react-devtools-shared/src/hooks/parseHookNames';

export type HookNamesModuleLoaderFunction = () => Thenable<ParseHookNamesModule>;
export type Context = HookNamesModuleLoaderFunction | null;

const HookNamesModuleLoaderContext = createContext<Context>(null);
HookNamesModuleLoaderContext.displayName = 'HookNamesModuleLoaderContext';

export default HookNamesModuleLoaderContext;
