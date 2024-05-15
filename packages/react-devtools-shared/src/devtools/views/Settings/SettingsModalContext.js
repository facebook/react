/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactContext} from 'shared/ReactTypes';

import * as React from 'react';
import {createContext, useMemo, useState} from 'react';

export type DisplayDensity = 'comfortable' | 'compact';
export type Theme = 'auto' | 'light' | 'dark';

type Context = {
  isModalShowing: boolean,
  setIsModalShowing: (value: boolean) => void,
  ...
};

const SettingsModalContext: ReactContext<Context> = createContext<Context>(
  ((null: any): Context),
);
SettingsModalContext.displayName = 'SettingsModalContext';

function SettingsModalContextController({
  children,
}: {
  children: React$Node,
}): React.Node {
  const [isModalShowing, setIsModalShowing] = useState<boolean>(false);

  const value = useMemo(
    () => ({isModalShowing, setIsModalShowing}),
    [isModalShowing, setIsModalShowing],
  );

  return (
    <SettingsModalContext.Provider value={value}>
      {children}
    </SettingsModalContext.Provider>
  );
}

export {SettingsModalContext, SettingsModalContextController};
