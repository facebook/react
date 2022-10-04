/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactContext} from 'shared/ReactTypes';

import * as React from 'react';
import {createContext, useCallback, useContext, useMemo, useState} from 'react';
import {unstable_batchedUpdates as batchedUpdates} from 'react-dom';
import {useLocalStorage, useSubscription} from '../hooks';
import {
  TreeDispatcherContext,
  TreeStateContext,
} from '../Components/TreeContext';
import {StoreContext} from '../context';
import {logEvent} from 'react-devtools-shared/src/Logger';

import type {ProfilingDataFrontend} from './types';

export type TabID = 'flame-chart' | 'ranked-chart' | 'timeline';

export type Context = {
  // Which tab is selected in the Profiler UI?
  selectedTabID: TabID,
  selectTab(id: TabID): void,

  // Store subscription based values.
  // The isProfiling value may be modified by the record button in the Profiler toolbar,
  // or from the backend itself (after a reload-and-profile action).
  // It is synced between the backend and frontend via a Store subscription.
  didRecordCommits: boolean,
  isProcessingData: boolean,
  isProfiling: boolean,
  profilingData: ProfilingDataFrontend | null,
  startProfiling(): void,
  stopProfiling(): void,
  supportsProfiling: boolean,

  // Which root should profiling data be shown for?
  // This value should be initialized to either:
  // 1. The selected root in the Components tree (if it has any profiling data) or
  // 2. The first root in the list with profiling data.
  rootID: number | null,
  setRootID: (id: number) => void,

  // Controls whether commits are filtered by duration.
  // This value is controlled by a filter toggle UI in the Profiler toolbar.
  // It impacts the commit selector UI as well as the fiber commits bar chart.
  isCommitFilterEnabled: boolean,
  setIsCommitFilterEnabled: (value: boolean) => void,
  minCommitDuration: number,
  setMinCommitDuration: (value: number) => void,

  // Which commit is currently selected in the commit selector UI.
  // Note that this is the index of the commit in all commits (non-filtered) that were profiled.
  // This value is controlled by the commit selector UI in the Profiler toolbar.
  // It impacts the flame graph and ranked charts.
  selectedCommitIndex: number | null,
  selectCommitIndex: (value: number | null) => void,

  // Which fiber is currently selected in the Ranked or Flamegraph charts?
  selectedFiberID: number | null,
  selectedFiberName: string | null,
  selectFiber: (id: number | null, name: string | null) => void,
};

const ProfilerContext: ReactContext<Context> = createContext<Context>(
  ((null: any): Context),
);
ProfilerContext.displayName = 'ProfilerContext';

type StoreProfilingState = {
  didRecordCommits: boolean,
  isProcessingData: boolean,
  isProfiling: boolean,
  profilingData: ProfilingDataFrontend | null,
  supportsProfiling: boolean,
};

type Props = {
  children: React$Node,
};

function ProfilerContextController({children}: Props): React.Node {
  const store = useContext(StoreContext);
  const {selectedElementID} = useContext(TreeStateContext);
  const dispatch = useContext(TreeDispatcherContext);

  const {profilerStore} = store;

  const subscription = useMemo(
    () => ({
      getCurrentValue: () => ({
        didRecordCommits: profilerStore.didRecordCommits,
        isProcessingData: profilerStore.isProcessingData,
        isProfiling: profilerStore.isProfiling,
        profilingData: profilerStore.profilingData,
        supportsProfiling: store.rootSupportsBasicProfiling,
      }),
      subscribe: (callback: Function) => {
        profilerStore.addListener('profilingData', callback);
        profilerStore.addListener('isProcessingData', callback);
        profilerStore.addListener('isProfiling', callback);
        store.addListener('rootSupportsBasicProfiling', callback);
        return () => {
          profilerStore.removeListener('profilingData', callback);
          profilerStore.removeListener('isProcessingData', callback);
          profilerStore.removeListener('isProfiling', callback);
          store.removeListener('rootSupportsBasicProfiling', callback);
        };
      },
    }),
    [profilerStore, store],
  );
  const {
    didRecordCommits,
    isProcessingData,
    isProfiling,
    profilingData,
    supportsProfiling,
  } = useSubscription<StoreProfilingState>(subscription);

  const [
    prevProfilingData,
    setPrevProfilingData,
  ] = useState<ProfilingDataFrontend | null>(null);
  const [rootID, setRootID] = useState<number | null>(null);
  const [selectedFiberID, selectFiberID] = useState<number | null>(null);
  const [selectedFiberName, selectFiberName] = useState<string | null>(null);

  const selectFiber = useCallback(
    (id: number | null, name: string | null) => {
      selectFiberID(id);
      selectFiberName(name);

      // Sync selection to the Components tab for convenience.
      // Keep in mind that profiling data may be from a previous session.
      // If data has been imported, we should skip the selection sync.
      if (
        id !== null &&
        profilingData !== null &&
        profilingData.imported === false
      ) {
        // We should still check to see if this element is still in the store.
        // It may have been removed during profiling.
        if (store.containsElement(id)) {
          dispatch({
            type: 'SELECT_ELEMENT_BY_ID',
            payload: id,
          });
        }
      }
    },
    [dispatch, selectFiberID, selectFiberName, store, profilingData],
  );

  const setRootIDAndClearFiber = useCallback(
    (id: number | null) => {
      selectFiber(null, null);
      setRootID(id);
    },
    [setRootID, selectFiber],
  );

  if (prevProfilingData !== profilingData) {
    batchedUpdates(() => {
      setPrevProfilingData(profilingData);

      const dataForRoots =
        profilingData !== null ? profilingData.dataForRoots : null;
      if (dataForRoots != null) {
        const firstRootID = dataForRoots.keys().next().value || null;

        if (rootID === null || !dataForRoots.has(rootID)) {
          let selectedElementRootID = null;
          if (selectedElementID !== null) {
            selectedElementRootID = store.getRootIDForElement(
              selectedElementID,
            );
          }
          if (
            selectedElementRootID !== null &&
            dataForRoots.has(selectedElementRootID)
          ) {
            setRootIDAndClearFiber(selectedElementRootID);
          } else {
            setRootIDAndClearFiber(firstRootID);
          }
        }
      }
    });
  }

  const [
    isCommitFilterEnabled,
    setIsCommitFilterEnabled,
  ] = useLocalStorage<boolean>('React::DevTools::isCommitFilterEnabled', false);
  const [minCommitDuration, setMinCommitDuration] = useLocalStorage<number>(
    'minCommitDuration',
    0,
  );

  const [selectedCommitIndex, selectCommitIndex] = useState<number | null>(
    null,
  );
  const [selectedTabID, selectTab] = useLocalStorage<TabID>(
    'React::DevTools::Profiler::defaultTab',
    'flame-chart',
    value => {
      logEvent({
        event_name: 'profiler-tab-changed',
        metadata: {
          tabId: value,
        },
      });
    },
  );

  const startProfiling = useCallback(() => {
    logEvent({
      event_name: 'profiling-start',
      metadata: {current_tab: selectedTabID},
    });
    store.profilerStore.startProfiling();
  }, [store, selectedTabID]);
  const stopProfiling = useCallback(() => store.profilerStore.stopProfiling(), [
    store,
  ]);

  if (isProfiling) {
    batchedUpdates(() => {
      if (selectedCommitIndex !== null) {
        selectCommitIndex(null);
      }
      if (selectedFiberID !== null) {
        selectFiberID(null);
        selectFiberName(null);
      }
    });
  }

  const value = useMemo(
    () => ({
      selectedTabID,
      selectTab,

      didRecordCommits,
      isProcessingData,
      isProfiling,
      profilingData,
      startProfiling,
      stopProfiling,
      supportsProfiling,

      rootID,
      setRootID: setRootIDAndClearFiber,

      isCommitFilterEnabled,
      setIsCommitFilterEnabled,
      minCommitDuration,
      setMinCommitDuration,

      selectedCommitIndex,
      selectCommitIndex,

      selectedFiberID,
      selectedFiberName,
      selectFiber,
    }),
    [
      selectedTabID,
      selectTab,

      didRecordCommits,
      isProcessingData,
      isProfiling,
      profilingData,
      startProfiling,
      stopProfiling,
      supportsProfiling,

      rootID,
      setRootID,
      setRootIDAndClearFiber,

      isCommitFilterEnabled,
      setIsCommitFilterEnabled,
      minCommitDuration,
      setMinCommitDuration,

      selectedCommitIndex,
      selectCommitIndex,

      selectedFiberID,
      selectedFiberName,
      selectFiber,
    ],
  );

  return (
    <ProfilerContext.Provider value={value}>
      {children}
    </ProfilerContext.Provider>
  );
}

export {ProfilerContext, ProfilerContextController};
