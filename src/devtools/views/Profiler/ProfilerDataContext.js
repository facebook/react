// @flow

import React, { createContext, useContext, useMemo, useState } from 'react';
import { TreeContext } from 'src/devtools/views/Elements/TreeContext';
import { StoreContext } from '../context';
import { useLocalStorage } from '../hooks';
import { ProfilerStatusContext } from './ProfilerStatusContext';

type Context = {|
  commitIndex: number | null,
  filteredCommitIndices: Array<number>,
  rendererID: number | null,
  rootID: number | null,
  setCommitIndex: (value: number) => void,
|};

const ProfilerDataContext = createContext<Context>(((null: any): Context));
ProfilerDataContext.displayName = 'ProfilerDataContext';

type Props = {|
  children: React$Node,
|};

function ProfilerDataContextController({ children }: Props) {
  const store = useContext(StoreContext);

  // TODO (profiling) The browser extension is a multi-root app,
  // so it won't work for the "Profiling" root to depend on a value that's set by the "Elements" root.
  // We'll either need to lift that state up into the (shared) Store,
  // or use a portal to share the contexts themselves between Chrome tabs.
  const { selectedElementID } = useContext(TreeContext);

  // If no root is selected, assume the first root; many React apps are single root anyway.
  let rendererID = null;
  let rootID = null;
  if (selectedElementID) {
    rendererID = store.getRendererIDForElement(
      ((selectedElementID: any): number)
    );
    rootID = store.getRootIDForElement(((selectedElementID: any): number));
  } else if (store.roots.length > 0) {
    rootID = store.roots[0];
    rendererID = store.getRendererIDForElement(((rootID: any): number));
  }

  // This value is important because it ensure we re-render after our suspense cache has been cleared.
  const { isProfiling } = useContext(ProfilerStatusContext);

  const profilingSummary = store.profilingCache.ProfilingSummary.read({
    rendererID: ((rendererID: any): number),
    rootID: ((rootID: any): number),
  });

  const [isCommitFilterEnabled] = useLocalStorage<boolean>(
    'isCommitFilterEnabled',
    false
  );
  const [minCommitDuration] = useLocalStorage<number>('minCommitDuration', 0);
  const { commitDurations } = profilingSummary;
  const filteredCommitIndices = useMemo(() => {
    const array = [];
    if (!isProfiling) {
      for (let i = 0; i < commitDurations.length; i++) {
        if (!isCommitFilterEnabled || commitDurations[i] >= minCommitDuration) {
          array.push(i);
        }
      }
    }
    return array;
  }, [commitDurations, isCommitFilterEnabled, isProfiling, minCommitDuration]);

  const [commitIndex, setCommitIndex] = useState<number | null>(
    commitDurations.length > 0 ? 0 : null
  );

  const value = useMemo(
    () => ({
      commitIndex,
      filteredCommitIndices,
      rendererID,
      rootID,
      setCommitIndex,
    }),
    [commitIndex, filteredCommitIndices, rendererID, rootID, setCommitIndex]
  );

  return (
    <ProfilerDataContext.Provider value={value}>
      {children}
    </ProfilerDataContext.Provider>
  );
}

export { ProfilerDataContext, ProfilerDataContextController };
