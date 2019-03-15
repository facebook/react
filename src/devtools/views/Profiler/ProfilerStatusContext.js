// @flow

import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useSubscription } from '../hooks';
import { StoreContext } from '../context';
import Store from '../../store';

type Context = {|
  hasProfilingData: boolean,
  isProfiling: boolean,
  startProfiling(value: boolean): void,
  stopProfiling(value: boolean): void,
|};

const ProfilerStatusContext = createContext<Context>(((null: any): Context));
ProfilerStatusContext.displayName = 'ProfilerStatusContext';

type StoreProfilingState = {|
  hasProfilingData: boolean,
  isProfiling: boolean,
|};

type Props = {|
  children: React$Node,
|};

function ProfilerStatusContextController({ children }: Props) {
  const store = useContext(StoreContext);

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

  const startProfiling = useCallback(() => store.startProfiling(), [store]);
  const stopProfiling = useCallback(() => store.stopProfiling(), [store]);

  const value = useMemo(
    () => ({
      hasProfilingData,
      isProfiling,
      startProfiling,
      stopProfiling,
    }),
    [hasProfilingData, isProfiling, startProfiling, stopProfiling]
  );

  return (
    <ProfilerStatusContext.Provider value={value}>
      {children}
    </ProfilerStatusContext.Provider>
  );
}

export { ProfilerStatusContext, ProfilerStatusContextController };
