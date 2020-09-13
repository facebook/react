/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// Reach styles need to come before any component styles.
// This makes overriding the styles simpler.
import '@reach/menu-button/styles.css';
import '@reach/tooltip/styles.css';

import * as React from 'react';
import {useEffect, useLayoutEffect, useMemo, useRef} from 'react';
import Store from '../store';
import {BridgeContext, ContextMenuContext, StoreContext} from './context';
import Components from './Components/Components';
import Profiler from './Profiler/Profiler';
import TabBar from './TabBar';
import {SettingsContextController} from './Settings/SettingsContext';
import {TreeContextController} from './Components/TreeContext';
import ViewElementSourceContext from './Components/ViewElementSourceContext';
import {ProfilerContextController} from './Profiler/ProfilerContext';
import {ModalDialogContextController} from './ModalDialog';
import ReactLogo from './ReactLogo';
import UnsupportedVersionDialog from './UnsupportedVersionDialog';
import WarnIfLegacyBackendDetected from './WarnIfLegacyBackendDetected';
import {useLocalStorage} from './hooks';

import styles from './DevTools.css';

import './root.css';

import type {InspectedElement} from 'react-devtools-shared/src/devtools/views/Components/types';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';

export type BrowserTheme = 'dark' | 'light';
export type TabID = 'components' | 'profiler';
export type ViewElementSource = (
  id: number,
  inspectedElement: InspectedElement,
) => void;
export type ViewAttributeSource = (
  id: number,
  path: Array<string | number>,
) => void;
export type CanViewElementSource = (
  inspectedElement: InspectedElement,
) => boolean;

export type Props = {|
  bridge: FrontendBridge,
  browserTheme?: BrowserTheme,
  canViewElementSourceFunction?: ?CanViewElementSource,
  defaultTab?: TabID,
  enabledInspectedElementContextMenu?: boolean,
  showTabBar?: boolean,
  store: Store,
  warnIfLegacyBackendDetected?: boolean,
  warnIfUnsupportedVersionDetected?: boolean,
  viewAttributeSourceFunction?: ?ViewAttributeSource,
  viewElementSourceFunction?: ?ViewElementSource,

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

const tabs = [componentsTab, profilerTab];

export default function DevTools({
  bridge,
  browserTheme = 'light',
  canViewElementSourceFunction,
  componentsPortalContainer,
  defaultTab = 'components',
  enabledInspectedElementContextMenu = false,
  overrideTab,
  profilerPortalContainer,
  showTabBar = false,
  store,
  warnIfLegacyBackendDetected = false,
  warnIfUnsupportedVersionDetected = false,
  viewAttributeSourceFunction,
  viewElementSourceFunction,
}: Props) {
  const [currentTab, setTab] = useLocalStorage<TabID>(
    'React::DevTools::defaultTab',
    defaultTab,
  );

  let tab = currentTab;

  if (overrideTab != null) {
    tab = overrideTab;
  }

  const viewElementSource = useMemo(
    () => ({
      canViewElementSourceFunction: canViewElementSourceFunction || null,
      viewElementSourceFunction: viewElementSourceFunction || null,
    }),
    [canViewElementSourceFunction, viewElementSourceFunction],
  );

  const contextMenu = useMemo(
    () => ({
      isEnabledForInspectedElement: enabledInspectedElementContextMenu,
      viewAttributeSourceFunction: viewAttributeSourceFunction || null,
    }),
    [enabledInspectedElementContextMenu, viewAttributeSourceFunction],
  );

  const devToolsRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!showTabBar) {
      return;
    }

    const div = devToolsRef.current;
    if (div === null) {
      return;
    }

    const ownerWindow = div.ownerDocument.defaultView;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case '1':
            setTab(tabs[0].id);
            event.preventDefault();
            event.stopPropagation();
            break;
          case '2':
            setTab(tabs[1].id);
            event.preventDefault();
            event.stopPropagation();
            break;
        }
      }
    };
    ownerWindow.addEventListener('keydown', handleKeyDown);
    return () => {
      ownerWindow.removeEventListener('keydown', handleKeyDown);
    };
  }, [showTabBar]);

  useLayoutEffect(() => {
    return () => {
      try {
        // Shut the Bridge down synchronously (during unmount).
        bridge.shutdown();
      } catch (error) {
        // Attempting to use a disconnected port.
      }
    };
  }, [bridge]);

  return (
    <BridgeContext.Provider value={bridge}>
      <StoreContext.Provider value={store}>
        <ContextMenuContext.Provider value={contextMenu}>
          <ModalDialogContextController>
            <SettingsContextController
              browserTheme={browserTheme}
              componentsPortalContainer={componentsPortalContainer}
              profilerPortalContainer={profilerPortalContainer}>
              <ViewElementSourceContext.Provider value={viewElementSource}>
                <TreeContextController>
                  <ProfilerContextController>
                    <div className={styles.DevTools} ref={devToolsRef}>
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
                            tabs={tabs}
                            type="navigation"
                          />
                        </div>
                      )}
                      <div
                        className={styles.TabContent}
                        hidden={tab !== 'components'}>
                        <Components
                          portalContainer={componentsPortalContainer}
                        />
                      </div>
                      <div
                        className={styles.TabContent}
                        hidden={tab !== 'profiler'}>
                        <Profiler portalContainer={profilerPortalContainer} />
                      </div>
                    </div>
                  </ProfilerContextController>
                </TreeContextController>
              </ViewElementSourceContext.Provider>
            </SettingsContextController>
            {warnIfLegacyBackendDetected && <WarnIfLegacyBackendDetected />}
            {warnIfUnsupportedVersionDetected && <UnsupportedVersionDialog />}
          </ModalDialogContextController>
        </ContextMenuContext.Provider>
      </StoreContext.Provider>
    </BridgeContext.Provider>
  );
}
