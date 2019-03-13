// @flow

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useSubscription } from '../hooks';
import { TreeContext } from 'src/devtools/views/Elements/TreeContext';
import { StoreContext } from '../context';
import Store from '../../store';

type Context = {|
  commitIndex: number,
  hasProfilingData: boolean,
  isProfiling: boolean,
  rendererID: number | null,
  rootID: number | null,
  setCommitIndex: (value: number) => void,
  startProfiling(value: boolean): void,
  stopProfiling(value: boolean): void,
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

  const { isProfiling, hasProfilingData } = useSubscription<
    StoreProfilingState,
    Store
  >(
    useMemo(
      () => ({
        source: store,
        getCurrentValue: (store: Store) => ({
          hasProfilingData: store.hasProfilingData,
          isProfiling: store.isProfiling,
        }),
        subscribe: (store: Store, callback: Function) => {
          store.addListener('isProfiling', callback);
          return () => store.removeListener('isProfiling', callback);
        },
      }),
      [store]
    )
  );

  const startProfiling = useCallback(() => store.startProfiling(), [store]);
  const stopProfiling = useCallback(() => store.stopProfiling(), [store]);

  // TODO (profiling) The browser extension is a multi-root app,
  // so ti won't work for the "Profiling" root to depend on a value that's set by the "Elements" root.
  // We'll either need to lift that state up into the (shared) Store,
  // or use a portal to share the contexts themselves between Chrome tabs.
  const { selectedElementID } = useContext(TreeContext);

  // If no root is selected, assume the first root.
  // Many React apps are single root anyway.
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

  const [commitIndex, setCommitIndex] = useState(0);
  const [prevRootID, setPrevRootID] = useState(rootID);
  if (prevRootID !== rootID) {
    setPrevRootID(rootID);
    setCommitIndex(0);
  }

  const [prevIsProfiling, setPrevIsProfiling] = useState(isProfiling);
  if (prevIsProfiling !== isProfiling) {
    setPrevIsProfiling(isProfiling);
    setCommitIndex(0);
  }

  const value = useMemo(
    () => ({
      commitIndex,
      hasProfilingData,
      isProfiling,
      rendererID,
      rootID,
      setCommitIndex,
      startProfiling,
      stopProfiling,
    }),
    [
      commitIndex,
      hasProfilingData,
      isProfiling,
      rendererID,
      rootID,
      setCommitIndex,
      startProfiling,
      stopProfiling,
    ]
  );

  return (
    <ProfilerContext.Provider value={value}>
      {children}
    </ProfilerContext.Provider>
  );
}

export { ProfilerContext, ProfilerContextController };
