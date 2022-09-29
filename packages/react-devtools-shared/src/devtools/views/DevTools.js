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
import {useCallback, useEffect, useLayoutEffect, useMemo, useRef} from 'react';
import Store from '../store';
import {
  BridgeContext,
  ContextMenuContext,
  StoreContext,
  OptionsContext,
} from './context';
import Components from './Components/Components';
import Profiler from './Profiler/Profiler';
import TabBar from './TabBar';
import {SettingsContextController} from './Settings/SettingsContext';
import {TreeContextController} from './Components/TreeContext';
import ViewElementSourceContext from './Components/ViewElementSourceContext';
import ViewSourceContext from './Components/ViewSourceContext';
import FetchFileWithCachingContext from './Components/FetchFileWithCachingContext';
import HookNamesModuleLoaderContext from 'react-devtools-shared/src/devtools/views/Components/HookNamesModuleLoaderContext';
import {ProfilerContextController} from './Profiler/ProfilerContext';
import {TimelineContextController} from 'react-devtools-timeline/src/TimelineContext';
import {ModalDialogContextController} from './ModalDialog';
import ReactLogo from './ReactLogo';
import UnsupportedBridgeProtocolDialog from './UnsupportedBridgeProtocolDialog';
import UnsupportedVersionDialog from './UnsupportedVersionDialog';
import WarnIfLegacyBackendDetected from './WarnIfLegacyBackendDetected';
import {useLocalStorage} from './hooks';
import ThemeProvider from './ThemeProvider';
import {LOCAL_STORAGE_DEFAULT_TAB_KEY} from '../../constants';

import styles from './DevTools.css';

import './root.css';

import type {InspectedElement} from 'react-devtools-shared/src/devtools/views/Components/types';
import type {FetchFileWithCaching} from './Components/FetchFileWithCachingContext';
import type {HookNamesModuleLoaderFunction} from 'react-devtools-shared/src/devtools/views/Components/HookNamesModuleLoaderContext';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import {logEvent} from '../../Logger';

export type BrowserTheme = 'dark' | 'light';
export type TabID = 'components' | 'profiler';

export type ViewElementSource = (
  id: number,
  inspectedElement: InspectedElement,
) => void;
export type ViewUrlSource = (url: string, row: number, column: number) => void;
export type ViewAttributeSource = (
  id: number,
  path: Array<string | number>,
) => void;
export type CanViewElementSource = (
  inspectedElement: InspectedElement,
) => boolean;

export type Props = {
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
  viewUrlSourceFunction?: ?ViewUrlSource,
  readOnly?: boolean,
  hideSettings?: boolean,
  hideToggleErrorAction?: boolean,
  hideToggleSuspenseAction?: boolean,
  hideLogAction?: boolean,
  hideViewSourceAction?: boolean,

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

  // Loads and parses source maps for function components
  // and extracts hook "names" based on the variables the hook return values get assigned to.
  // Not every DevTools build can load source maps, so this property is optional.
  fetchFileWithCaching?: ?FetchFileWithCaching,
  // TODO (Webpack 5) Hopefully we can remove this prop after the Webpack 5 migration.
  hookNamesModuleLoaderFunction?: ?HookNamesModuleLoaderFunction,
};

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
  fetchFileWithCaching,
  hookNamesModuleLoaderFunction,
  overrideTab,
  profilerPortalContainer,
  showTabBar = false,
  store,
  warnIfLegacyBackendDetected = false,
  warnIfUnsupportedVersionDetected = false,
  viewAttributeSourceFunction,
  viewElementSourceFunction,
  viewUrlSourceFunction,
  readOnly,
  hideSettings,
  hideToggleErrorAction,
  hideToggleSuspenseAction,
  hideLogAction,
  hideViewSourceAction,
}: Props): React.Node {
  const [currentTab, setTab] = useLocalStorage<TabID>(
    LOCAL_STORAGE_DEFAULT_TAB_KEY,
    defaultTab,
  );

  let tab = currentTab;

  if (overrideTab != null) {
    tab = overrideTab;
  }

  const selectTab = useCallback(
    (tabId: TabID) => {
      // We show the TabBar when DevTools is NOT rendered as a browser extension.
      // In this case, we want to capture when people select tabs with the TabBar.
      // When DevTools is rendered as an extension, we capture this event when
      // the browser devtools panel changes.
      if (showTabBar === true) {
        if (tabId === 'components') {
          logEvent({event_name: 'selected-components-tab'});
        } else {
          logEvent({event_name: 'selected-profiler-tab'});
        }
      }
      setTab(tabId);
    },
    [setTab, showTabBar],
  );

  const options = useMemo(
    () => ({
      readOnly: readOnly || false,
      hideSettings: hideSettings || false,
      hideToggleErrorAction: hideToggleErrorAction || false,
      hideToggleSuspenseAction: hideToggleSuspenseAction || false,
      hideLogAction: hideLogAction || false,
      hideViewSourceAction: hideViewSourceAction || false,
    }),
    [
      readOnly,
      hideSettings,
      hideToggleErrorAction,
      hideToggleSuspenseAction,
      hideLogAction,
      hideViewSourceAction,
    ],
  );

  const viewElementSource = useMemo(
    () => ({
      canViewElementSourceFunction: canViewElementSourceFunction || null,
      viewElementSourceFunction: viewElementSourceFunction || null,
    }),
    [canViewElementSourceFunction, viewElementSourceFunction],
  );

  const viewSource = useMemo(
    () => ({
      viewUrlSourceFunction: viewUrlSourceFunction || null,
      // todo(blakef): Add inspect(...) method here and remove viewElementSource
      // to consolidate source code inspection.
    }),
    [viewUrlSourceFunction],
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
            selectTab(tabs[0].id);
            event.preventDefault();
            event.stopPropagation();
            break;
          case '2':
            selectTab(tabs[1].id);
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

  useEffect(() => {
    logEvent({event_name: 'loaded-dev-tools'});
  }, []);
  return (
    <BridgeContext.Provider value={bridge}>
      <StoreContext.Provider value={store}>
        <OptionsContext.Provider value={options}>
          <ContextMenuContext.Provider value={contextMenu}>
            <ModalDialogContextController>
              <SettingsContextController
                browserTheme={browserTheme}
                componentsPortalContainer={componentsPortalContainer}
                profilerPortalContainer={profilerPortalContainer}>
                <ViewElementSourceContext.Provider value={viewElementSource}>
                  <ViewSourceContext.Provider value={viewSource}>
                    <HookNamesModuleLoaderContext.Provider
                      value={hookNamesModuleLoaderFunction || null}>
                      <FetchFileWithCachingContext.Provider
                        value={fetchFileWithCaching || null}>
                        <TreeContextController>
                          <ProfilerContextController>
                            <TimelineContextController>
                              <ThemeProvider>
                                <div
                                  className={styles.DevTools}
                                  ref={devToolsRef}
                                  data-react-devtools-portal-root={true}>
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
                                        selectTab={selectTab}
                                        tabs={tabs}
                                        type="navigation"
                                      />
                                    </div>
                                  )}
                                  <div
                                    className={styles.TabContent}
                                    hidden={tab !== 'components'}>
                                    <Components
                                      portalContainer={
                                        componentsPortalContainer
                                      }
                                    />
                                  </div>
                                  <div
                                    className={styles.TabContent}
                                    hidden={tab !== 'profiler'}>
                                    <Profiler
                                      portalContainer={profilerPortalContainer}
                                    />
                                  </div>
                                </div>
                              </ThemeProvider>
                            </TimelineContextController>
                          </ProfilerContextController>
                        </TreeContextController>
                      </FetchFileWithCachingContext.Provider>
                    </HookNamesModuleLoaderContext.Provider>
                  </ViewSourceContext.Provider>
                </ViewElementSourceContext.Provider>
              </SettingsContextController>
              <UnsupportedBridgeProtocolDialog />
              {warnIfLegacyBackendDetected && <WarnIfLegacyBackendDetected />}
              {warnIfUnsupportedVersionDetected && <UnsupportedVersionDialog />}
            </ModalDialogContextController>
          </ContextMenuContext.Provider>
        </OptionsContext.Provider>
      </StoreContext.Provider>
    </BridgeContext.Provider>
  );
}
