// @flow

import React, { useState } from 'react';
import Store from '../store';
import { BridgeContext, StoreContext } from './context';
import Elements from './Elements';
import Profiler from './Profiler';
import Settings from './Settings';
import TabBar from './TabBar';
import { SettingsContextController } from './SettingsContext';
import { TreeContextController } from './TreeContext';

import styles from './DevTools.css';

import './root.css';

import type { Bridge } from '../../types';

export type BrowserName = 'Chrome' | 'Firefox';
export type BrowserTheme = 'dark' | 'light';
export type TabID = 'elements' | 'profiler' | 'settings';

export type Props = {|
  bridge: Bridge,
  browserName: BrowserName,
  defaultTab?: TabID,
  browserTheme: BrowserTheme,
  showTabBar?: boolean,
  store: Store,
|};

export default function DevTools({
  bridge,
  browserName,
  defaultTab = 'elements',
  browserTheme = 'light',
  showTabBar = false,
  store,
}: Props) {
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
            <div className={styles.DevTools}>
              {showTabBar && (
                <div className={styles.TabBar}>
                  <TabBar currentTab={tab} selectTab={setTab} />
                </div>
              )}
              <div className={styles.TabContent}>{tabElement}</div>
            </div>
          </TreeContextController>
        </SettingsContextController>
      </StoreContext.Provider>
    </BridgeContext.Provider>
  );
}
