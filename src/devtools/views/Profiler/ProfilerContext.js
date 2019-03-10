// @flow

import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useReducer,
} from 'react';
import { BridgeContext, StoreContext } from '../context';
import reducer from './reducer';

import type {
  HANDLE_OPERATIONS_ACTION,
  HANDLE_PROFILING_STATUS_CHANGE_ACTION,
  SEND_START_PROFILING_ACTION,
  SEND_STOP_PROFILING_ACTION,
} from './reducer';

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

  // Some of this reducer's actions require access to the store.
  // The store is mutable, but the Store itself is global and lives for the lifetime of the DevTools,
  // so we don't need to re-init the reducer in any special way.
  const [state, dispatch] = useReducer(reducer, {
    hasProfilingData: false,
    isProfiling: false,
    _operations: [],
    _snapshot: new Map(),
  });

  const startProfiling = useCallback(() => {
    bridge.send('startProfiling');
    dispatch(({ type: 'SEND_START_PROFILING' }: SEND_START_PROFILING_ACTION));
  }, [bridge, dispatch]);
  const stopProfiling = useCallback(() => {
    bridge.send('stopProfiling');
    dispatch(({ type: 'SEND_STOP_PROFILING' }: SEND_STOP_PROFILING_ACTION));
  }, [bridge, dispatch]);

  const value = useMemo(
    () => ({
      hasProfilingData: state.hasProfilingData,
      isProfiling: state.isProfiling,
      startProfiling,
      stopProfiling,
    }),
    [state, startProfiling, stopProfiling]
  );

  useLayoutEffect(() => {
    const handleOperations = (operations: Uint32Array) =>
      dispatch(
        ({
          type: 'HANDLE_OPERATIONS',
          payload: operations,
        }: HANDLE_OPERATIONS_ACTION)
      );

    const handleProfilingStatus = (isProfiling: boolean) =>
      dispatch(
        ({
          type: 'HANDLE_PROFILING_STATUS_CHANGE',
          payload: { isProfiling, store },
        }: HANDLE_PROFILING_STATUS_CHANGE_ACTION)
      );

    bridge.addListener('operations', handleOperations);
    bridge.addListener('profilingStatus', handleProfilingStatus);

    // It's possible that profiling has already started (e.g. "reload and start profiling")
    // so the frontend needs to ask the backend for its status after mounting.
    bridge.send('getProfilingStatus');

    return () => {
      bridge.removeListener('operations', handleOperations);
      bridge.removeListener('profilingStatus', handleProfilingStatus);
    };
  }, [bridge, dispatch, store]);

  return (
    <ProfilerContext.Provider value={value}>
      {children}
    </ProfilerContext.Provider>
  );
}

export { ProfilerContext, ProfilerContextController };
