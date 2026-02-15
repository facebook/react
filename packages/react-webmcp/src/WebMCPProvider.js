/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {isWebMCPAvailable, isWebMCPTestingAvailable} from './ModelContext';

const {createContext, useContext, useMemo} = React;

type WebMCPContextValue = {
  available: boolean,
  testingAvailable: boolean,
};

const WebMCPReactContext = createContext<WebMCPContextValue>({
  available: false,
  testingAvailable: false,
});

/**
 * Provides WebMCP availability information to the component tree.
 *
 * Wrap your application (or a subtree) with `<WebMCPProvider>` to let
 * child components check WebMCP availability via the `useWebMCPStatus` hook.
 */
export function WebMCPProvider({children}: {children: React$Node}): React$Node {
  const value = useMemo(
    () => ({
      available: isWebMCPAvailable(),
      testingAvailable: isWebMCPTestingAvailable(),
    }),
    [],
  );

  return React.createElement(WebMCPReactContext.Provider, {value}, children);
}

/**
 * Returns the current WebMCP availability status.
 * Must be used within a `<WebMCPProvider>`.
 */
export function useWebMCPStatus(): WebMCPContextValue {
  return useContext(WebMCPReactContext);
}
