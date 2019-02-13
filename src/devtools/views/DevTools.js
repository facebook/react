// @flow

import React, { useMemo, useState } from 'react';
import Store from '../store';
import { BridgeContext, StoreContext } from './context';
import Elements from './Elements';
import Profiler from './Profiler';
import Settings from './Settings';
import TabBar from './TabBar';
import { SettingsContextController } from './SettingsContext';
import { TreeContextController } from './TreeContext';

import './root.css';

import type { Bridge } from '../../types';

export type TabID = 'elements' | 'profiler' | 'settings';
export type BrowserTheme = 'dark' | 'light';

export type Props = {|
  bridge: Bridge,
  browserName: string,
  defaultTab?: TabID,
  browserTheme: BrowserTheme,
  showTabBar?: boolean,
|};

export default function DevTools({
  bridge,
  browserName,
  defaultTab = 'elements',
  browserTheme = 'light',
  showTabBar = false,
}: Props) {
  const store = useMemo<Store>(() => new Store(bridge), []);
  const [tab, setTab] = useState(defaultTab);

  let tabElement;
  switch (tab) {
    case 'profiler':
      tabElement = <Profiler />;
      break;
    case 'settings':
      tabElement = <Settings />;
      break;
    case 'elements':
    default:
      tabElement = <Elements />;
      break;
  }

  return (
    <BridgeContext.Provider value={bridge}>
      <StoreContext.Provider value={store}>
        <SettingsContextController browserTheme={browserTheme}>
          <TreeContextController>
            {showTabBar && <TabBar currentTab={tab} selectTab={setTab} />}
            {tabElement}
          </TreeContextController>
        </SettingsContextController>
      </StoreContext.Provider>
    </BridgeContext.Provider>
  );
}
