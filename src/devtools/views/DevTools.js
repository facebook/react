// @flow

import React, { useEffect, useState } from 'react';
import Store from '../store';
import { BridgeContext, StoreContext } from './context';
import Elements from './Elements/Elements';
import Profiler from './Profiler/Profiler';
import Settings from './Settings/Settings';
import TabBar from './TabBar';
import { SettingsContextController } from './Settings/SettingsContext';
import { TreeContextController } from './Elements/TreeContext';
import { ProfilerContextController } from './Profiler/ProfilerContext';
import ReactLogo from './ReactLogo';

import styles from './DevTools.css';

import './root.css';

import type { Bridge } from '../../types';

export type BrowserName = 'Chrome' | 'Firefox';
export type BrowserTheme = 'dark' | 'light';
export type TabID = 'elements' | 'profiler' | 'settings';

export type Props = {|
  bridge: Bridge,
  browserName: BrowserName,
  browserTheme: BrowserTheme,
  defaultTab?: TabID,
  elementsPortalContainer?: Element,
  overrideTab?: TabID,
  profilerPortalContainer?: Element,
  settingsPortalContainer?: Element,
  showTabBar?: boolean,
  store: Store,
  viewElementSource?: ?Function,
|};

const elementTab = {
  id: ('elements': TabID),
  icon: 'elements',
  label: 'Elements',
  title: 'React Elements',
};
const profilerTab = {
  id: ('profiler': TabID),
  icon: 'profiler',
  label: 'Profiler',
  title: 'React Profiler',
};
const settingsTab = {
  id: ('settings': TabID),
  icon: 'settings',
  label: 'Settings',
  title: 'React Settings',
};

const tabsWithProfiler = [elementTab, profilerTab, settingsTab];
const tabsWithoutProfiler = [elementTab, settingsTab];

export default function DevTools({
  bridge,
  browserName,
  browserTheme = 'light',
  defaultTab = 'elements',
  elementsPortalContainer,
  overrideTab,
  profilerPortalContainer,
  settingsPortalContainer,
  showTabBar = false,
  store,
  viewElementSource = null,
}: Props) {
  const [tab, setTab] = useState(defaultTab);
  if (overrideTab != null && overrideTab !== tab) {
    setTab(overrideTab);
  }

  const [supportsProfiling, setSupportsProfiling] = useState(
    store.supportsProfiling
  );

  // Show/hide the "Profiler" button depending on if profiling is supported.
  useEffect(() => {
    if (supportsProfiling !== store.supportsProfiling) {
      setSupportsProfiling(store.supportsProfiling);
    }

    const handleRoots = () => {
      if (supportsProfiling !== store.supportsProfiling) {
        setSupportsProfiling(store.supportsProfiling);
      }
    };

    store.addListener('roots', handleRoots);
    return () => {
      store.removeListener('roots', handleRoots);
    };
  }, [store, supportsProfiling]);

  let tabElement;
  switch (tab) {
    case 'profiler':
      tabElement = <Profiler portalContainer={profilerPortalContainer} />;
      break;
    case 'settings':
      tabElement = <Settings portalContainer={settingsPortalContainer} />;
      break;
    case 'elements':
    default:
      tabElement = <Elements portalContainer={elementsPortalContainer} />;
      break;
  }

  return (
    <BridgeContext.Provider value={bridge}>
      <StoreContext.Provider value={store}>
        <SettingsContextController
          browserTheme={browserTheme}
          elementsPortalContainer={elementsPortalContainer}
          profilerPortalContainer={profilerPortalContainer}
          settingsPortalContainer={settingsPortalContainer}
        >
          <TreeContextController viewElementSource={viewElementSource}>
            <ProfilerContextController>
              <div className={styles.DevTools}>
                {showTabBar && (
                  <div className={styles.TabBar}>
                    <ReactLogo />
                    <span className={styles.DevToolsVersion}>
                      {process.env.DEVTOOLS_VERSION}
                    </span>
                    <div className={styles.Spacer} />
                    <TabBar
                      currentTab={tab}
                      id="DevTools"
                      selectTab={setTab}
                      size="large"
                      tabs={
                        supportsProfiling
                          ? tabsWithProfiler
                          : tabsWithoutProfiler
                      }
                    />
                  </div>
                )}
                <div className={styles.TabContent}>{tabElement}</div>
              </div>
            </ProfilerContextController>
          </TreeContextController>
        </SettingsContextController>
      </StoreContext.Provider>
    </BridgeContext.Provider>
  );
}
