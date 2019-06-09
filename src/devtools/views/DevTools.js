// @flow

// Reach styles need to come before any component styles.
// This makes overridding the styles simpler.
import '@reach/menu-button/styles.css';
import '@reach/tooltip/styles.css';

import React, { useState } from 'react';
import Bridge from 'src/bridge';
import Store from '../store';
import { BridgeContext, StoreContext } from './context';
import Components from './Components/Components';
import Profiler from './Profiler/Profiler';
import Settings from './Settings/Settings';
import TabBar from './TabBar';
import { SettingsContextController } from './Settings/SettingsContext';
import { TreeContextController } from './Components/TreeContext';
import ViewElementSourceContext from './Components/ViewElementSourceContext';
import { ProfilerContextController } from './Profiler/ProfilerContext';
import { ModalDialogContextController } from './ModalDialog';
import ReactLogo from './ReactLogo';

import styles from './DevTools.css';

import './root.css';

export type BrowserName = 'Chrome' | 'Firefox';
export type BrowserTheme = 'dark' | 'light';
export type TabID = 'components' | 'profiler' | 'settings';

export type Props = {|
  bridge: Bridge,
  browserName: BrowserName,
  browserTheme: BrowserTheme,
  defaultTab?: TabID,
  showTabBar?: boolean,
  store: Store,
  viewElementSource?: ?Function,

  // This property is used only by the web extension target.
  // The built-in tab UI is hidden in that case, in favor of the browser's own panel tabs.
  // This is done to save space within the app.
  // Because of this, the extension needs to be able to change which tab is active/rendered.
  overrideTab?: TabID,

  // To avoid potential multi-root trickiness, the web extension uses portals to render tabs.
  // The root <DevTools> app is rendered in the top-level extension window,
  // but individual tabs (e.g. Components, Profiling) can be rendered into portals within their browser panels.
  componentsPortalContainer?: Element,
  profilerPortalContainer?: Element,
  settingsPortalContainer?: Element,
|};

const componentsTab = {
  id: ('components': TabID),
  icon: 'components',
  label: 'Components',
  title: 'React Components',
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

const tabs = [componentsTab, profilerTab, settingsTab];

export default function DevTools({
  bridge,
  browserName,
  browserTheme = 'light',
  defaultTab = 'components',
  componentsPortalContainer,
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

  return (
    <BridgeContext.Provider value={bridge}>
      <StoreContext.Provider value={store}>
        <ModalDialogContextController>
          <SettingsContextController
            browserTheme={browserTheme}
            componentsPortalContainer={componentsPortalContainer}
            profilerPortalContainer={profilerPortalContainer}
            settingsPortalContainer={settingsPortalContainer}
          >
            <ViewElementSourceContext.Provider value={viewElementSource}>
              <TreeContextController>
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
                          tabs={tabs}
                        />
                      </div>
                    )}
                    <div
                      className={styles.TabContent}
                      hidden={tab !== 'components'}
                    >
                      <Components portalContainer={componentsPortalContainer} />
                    </div>
                    <div
                      className={styles.TabContent}
                      hidden={tab !== 'profiler'}
                    >
                      <Profiler portalContainer={profilerPortalContainer} />
                    </div>
                    <div
                      className={styles.TabContent}
                      hidden={tab !== 'settings'}
                    >
                      <Settings portalContainer={settingsPortalContainer} />
                    </div>
                  </div>
                </ProfilerContextController>
              </TreeContextController>
            </ViewElementSourceContext.Provider>
          </SettingsContextController>
        </ModalDialogContextController>
      </StoreContext.Provider>
    </BridgeContext.Provider>
  );
}
