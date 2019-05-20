// @flow

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { unstable_batchedUpdates as batchedUpdates } from 'react-dom';
import { useLocalStorage, useSubscription } from '../hooks';
import {
  TreeDispatcherContext,
  TreeStateContext,
} from '../Components/TreeContext';
import { StoreContext } from '../context';
import Store from '../../store';

import type { ImportedProfilingData } from './types';

export type TabID = 'flame-chart' | 'ranked-chart' | 'interactions';

type Context = {|
  // Which tab is selexted in the Profiler UI?
  selectedTabID: TabID,
  selectTab(id: TabID): void,

  // Have we recorded any profiling data?
  // Are we currently profiling?
  // This value may be modified by the record button in the Profiler toolbar,
  // or from the backend itself (after a reload-and-profile action).
  // It is synced between the backend and frontend via a Store subscription.
  hasProfilingData: boolean,
  isProfiling: boolean,
  startProfiling(value: boolean): void,
  stopProfiling(value: boolean): void,

  // Which renderer and root should profiling data be shown for?
  // Often this will correspond to the selected renderer and root in the Elements panel.
  // If nothing is selected though, this will default to the first root.
  rendererID: number | null,
  rootID: number | null,
  rootHasProfilingData: boolean,

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

  // Which interaction is currently selected in the Interactions graph?
  selectedInteractionID: number | null,
  selectInteraction: (id: number | null) => void,
|};

const ProfilerContext = createContext<Context>(((null: any): Context));
ProfilerContext.displayName = 'ProfilerContext';

type StoreProfilingState = {|
  hasProfilingData: boolean,
  profilingData: ImportedProfilingData | null,
  isProfiling: boolean,
|};

type Props = {|
  children: React$Node,
|};

function ProfilerContextController({ children }: Props) {
  const store = useContext(StoreContext);
  const { selectedElementID } = useContext(TreeStateContext);
  const dispatch = useContext(TreeDispatcherContext);

  const subscription = useMemo(
    () => ({
      getCurrentValue: () => ({
        hasProfilingData: store.hasProfilingData,
        profilingData: store.profilingData,
        isProfiling: store.isProfiling,
      }),
      subscribe: (callback: Function) => {
        store.addListener('profilingData', callback);
        store.addListener('isProfiling', callback);
        return () => {
          store.removeListener('profilingData', callback);
          store.removeListener('isProfiling', callback);
        };
      },
    }),
    [store]
  );
  const { isProfiling, hasProfilingData, profilingData } = useSubscription<
    StoreProfilingState,
    Store
  >(subscription);

  let rendererID = null;
  let rootID = null;
  let rootHasProfilingData = false;
  if (profilingData !== null) {
    rootHasProfilingData = true;
  } else if (selectedElementID !== null) {
    rendererID = store.getRendererIDForElement(selectedElementID);
    rootID = store.getRootIDForElement(selectedElementID);
    rootHasProfilingData =
      rootID === null ? false : store.profilingOperations.has(rootID);
  } else if (store.roots.length > 0) {
    // If no root is selected, assume the first root; many React apps are single root anyway.
    rootID = store.roots[0];
    rootHasProfilingData = store.profilingOperations.has(rootID);
    rendererID = store.getRendererIDForElement(rootID);
  }

  const startProfiling = useCallback(() => store.startProfiling(), [store]);
  const stopProfiling = useCallback(() => store.stopProfiling(), [store]);

  const [
    isCommitFilterEnabled,
    setIsCommitFilterEnabled,
  ] = useLocalStorage<boolean>('React::DevTools::isCommitFilterEnabled', false);
  const [minCommitDuration, setMinCommitDuration] = useLocalStorage<number>(
    'minCommitDuration',
    0
  );

  const [selectedCommitIndex, selectCommitIndex] = useState<number | null>(
    null
  );
  const [selectedTabID, selectTab] = useState<TabID>('flame-chart');
  const [selectedFiberID, selectFiberID] = useState<number | null>(null);
  const [selectedFiberName, selectFiberName] = useState<string | null>(null);
  const [selectedInteractionID, selectInteraction] = useState<number | null>(
    null
  );

  const selectFiber = useCallback(
    (id: number | null, name: string | null) => {
      selectFiberID(id);
      selectFiberName(name);
      if (id !== null) {
        // If this element is still in the store, then select it in the Components tab as well.
        const element = store.getElementByID(id);
        if (element !== null) {
          dispatch({
            type: 'SELECT_ELEMENT_BY_ID',
            payload: id,
          });
        }
      }
    },
    [dispatch, selectFiberID, selectFiberName, store]
  );

  if (isProfiling) {
    batchedUpdates(() => {
      if (selectedCommitIndex !== null) {
        selectCommitIndex(null);
      }
      if (selectedFiberID !== null) {
        selectFiberID(null);
        selectFiberName(null);
      }
      if (selectedInteractionID !== null) {
        selectInteraction(null);
      }
    });
  }

  const value = useMemo(
    () => ({
      selectedTabID,
      selectTab,

      hasProfilingData,
      isProfiling,
      startProfiling,
      stopProfiling,

      rendererID,
      rootID,
      rootHasProfilingData,

      isCommitFilterEnabled,
      setIsCommitFilterEnabled,
      minCommitDuration,
      setMinCommitDuration,

      selectedCommitIndex,
      selectCommitIndex,

      selectedFiberID,
      selectedFiberName,
      selectFiber,

      selectedInteractionID,
      selectInteraction,
    }),
    [
      selectedTabID,
      selectTab,

      hasProfilingData,
      isProfiling,
      startProfiling,
      stopProfiling,

      rendererID,
      rootID,
      rootHasProfilingData,

      isCommitFilterEnabled,
      setIsCommitFilterEnabled,
      minCommitDuration,
      setMinCommitDuration,

      selectedCommitIndex,
      selectCommitIndex,

      selectedFiberID,
      selectedFiberName,
      selectFiber,

      selectedInteractionID,
      selectInteraction,
    ]
  );

  return (
    <ProfilerContext.Provider value={value}>
      {children}
    </ProfilerContext.Provider>
  );
}

export { ProfilerContext, ProfilerContextController };
