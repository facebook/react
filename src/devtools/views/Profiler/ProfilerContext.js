// @flow

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { BridgeContext, StoreContext } from '../context';

// TODO (profiling) Connect to store and listen for new roots and load data.

type Context = {|
  hasProfilingData: boolean,
  isProfiling: boolean,
  startProfiling(value: boolean): void,
  stopProfiling(value: boolean): void,
|};

const ProfilerContext = createContext<Context>(((null: any): Context));
ProfilerContext.displayName = 'ProfilerContext';

type Props = {|
  children: React$Node,
|};

function ProfilerContextController({ children }: Props) {
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  const [isProfiling, setIsProfiling] = useState(false);

  const startProfiling = useCallback(() => {
    bridge.send('startProfiling');
    setIsProfiling(true);
  }, [bridge]);
  const stopProfiling = useCallback(() => {
    bridge.send('stopProfiling');
    setIsProfiling(false);
  }, [bridge]);

  const value = useMemo(
    () => ({
      hasProfilingData: false, // TODO (profiling) Connect to store and listen for new roots and load data.
      isProfiling,
      startProfiling,
      stopProfiling,
    }),
    [isProfiling, startProfiling, stopProfiling]
  );

  return (
    <ProfilerContext.Provider value={value}>
      {children}
    </ProfilerContext.Provider>
  );
}

export { ProfilerContext, ProfilerContextController };
