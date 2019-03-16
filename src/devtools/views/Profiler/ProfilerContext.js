// @flow

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useLocalStorage, useSubscription } from '../hooks';
import { TreeContext } from '../Elements/TreeContext';
import { StoreContext } from '../context';
import Store from '../../store';

type Context = {|
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
  setSelectedCommitIndex: (value: number | null) => void,
|};

const ProfilerContext = createContext<Context>(((null: any): Context));
ProfilerContext.displayName = 'ProfilerContext';

type StoreProfilingState = {|
  hasProfilingData: boolean,
  isProfiling: boolean,
|};

type Props = {|
  children: React$Node,
|};

function ProfilerContextController({ children }: Props) {
  const store = useContext(StoreContext);
  const { selectedElementID } = useContext(TreeContext);

  const subscription = useMemo(
    () => ({
      getCurrentValue: () => ({
        hasProfilingData: store.hasProfilingData,
        isProfiling: store.isProfiling,
      }),
      subscribe: (callback: Function) => {
        store.addListener('isProfiling', callback);
        return () => store.removeListener('isProfiling', callback);
      },
    }),
    [store]
  );
  const { isProfiling, hasProfilingData } = useSubscription<
    StoreProfilingState,
    Store
  >(subscription);

  // TODO (profiling) The browser extension is a multi-root app,
  // so it won't work for the "Profiling" root to depend on a value that's set by the "Elements" root.
  // We'll either need to lift that state up into the (shared) Store,
  // or use a portal to share the contexts themselves between Chrome tabs.
  let rendererID = null;
  let rootID = null;
  let rootHasProfilingData = false;
  if (selectedElementID) {
    rendererID = store.getRendererIDForElement(
      ((selectedElementID: any): number)
    );
    rootID = store.getRootIDForElement(((selectedElementID: any): number));
    rootHasProfilingData = store.profilingOperations.has(
      ((rootID: any): number)
    );
  } else if (store.roots.length > 0) {
    // If no root is selected, assume the first root; many React apps are single root anyway.
    rootID = store.roots[0];
    rootHasProfilingData = store.profilingOperations.has(rootID);
    rendererID = store.getRendererIDForElement(((rootID: any): number));
  }

  const startProfiling = useCallback(() => store.startProfiling(), [store]);
  const stopProfiling = useCallback(() => store.stopProfiling(), [store]);

  const [
    isCommitFilterEnabled,
    setIsCommitFilterEnabled,
  ] = useLocalStorage<boolean>('isCommitFilterEnabled', false);
  const [minCommitDuration, setMinCommitDuration] = useLocalStorage<number>(
    'minCommitDuration',
    0
  );

  const [selectedCommitIndex, setSelectedCommitIndex] = useState<number | null>(
    null
  );

  const value = useMemo(
    () => ({
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
      setSelectedCommitIndex,
    }),
    [
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
      setSelectedCommitIndex,
    ]
  );

  return (
    <ProfilerContext.Provider value={value}>
      {children}
    </ProfilerContext.Provider>
  );
}

export { ProfilerContext, ProfilerContextController };
