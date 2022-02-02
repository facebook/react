/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {StoreContext} from 'react-devtools-shared/src/devtools/views/context';

import type {
  HorizontalScrollStateChangeCallback,
  TimelineData,
  SearchRegExpStateChangeCallback,
  ViewState,
} from './types';
import type {RefObject} from 'shared/ReactTypes';

export type Context = {|
  file: File | null,
  inMemoryTimelineData: Array<TimelineData> | null,
  isTimelineSupported: boolean,
  searchInputContainerRef: RefObject,
  setFile: (file: File | null) => void,
  viewState: ViewState,
|};

const TimelineContext = createContext<Context>(((null: any): Context));
TimelineContext.displayName = 'TimelineContext';

type Props = {|
  children: React$Node,
|};

function TimelineContextController({children}: Props) {
  const searchInputContainerRef = useRef(null);
  const [file, setFile] = useState<string | null>(null);

  const store = useContext(StoreContext);

  const isTimelineSupported = useSyncExternalStore<boolean>(
    function subscribe(callback) {
      store.addListener('rootSupportsTimelineProfiling', callback);
      return function unsubscribe() {
        store.removeListener('rootSupportsTimelineProfiling', callback);
      };
    },
    function getState() {
      return store.rootSupportsTimelineProfiling;
    },
  );

  const inMemoryTimelineData = useSyncExternalStore<Array<TimelineData> | null>(
    function subscribe(callback) {
      store.profilerStore.addListener('isProcessingData', callback);
      store.profilerStore.addListener('profilingData', callback);
      return function unsubscribe() {
        store.profilerStore.removeListener('isProcessingData', callback);
        store.profilerStore.removeListener('profilingData', callback);
      };
    },
    function getState() {
      return store.profilerStore.profilingData?.timelineData || null;
    },
  );

  // Recreate view state any time new profiling data is imported.
  const viewState = useMemo<ViewState>(() => {
    const horizontalScrollStateChangeCallbacks: Set<HorizontalScrollStateChangeCallback> = new Set();
    const searchRegExpStateChangeCallbacks: Set<SearchRegExpStateChangeCallback> = new Set();

    const horizontalScrollState = {
      offset: 0,
      length: 0,
    };

    const state: ViewState = {
      horizontalScrollState,
      onHorizontalScrollStateChange: callback => {
        horizontalScrollStateChangeCallbacks.add(callback);
      },
      onSearchRegExpStateChange: callback => {
        searchRegExpStateChangeCallbacks.add(callback);
      },
      searchRegExp: null,
      updateHorizontalScrollState: scrollState => {
        if (
          horizontalScrollState.offset === scrollState.offset &&
          horizontalScrollState.length === scrollState.length
        ) {
          return;
        }

        horizontalScrollState.offset = scrollState.offset;
        horizontalScrollState.length = scrollState.length;

        horizontalScrollStateChangeCallbacks.forEach(callback => {
          callback(scrollState);
        });
      },
      updateSearchRegExpState: (searchRegExp: RegExp | null) => {
        state.searchRegExp = searchRegExp;

        searchRegExpStateChangeCallbacks.forEach(callback => {
          callback(searchRegExp);
        });
      },
      viewToMutableViewStateMap: new Map(),
    };

    return state;
  }, [file]);

  const value = useMemo(
    () => ({
      file,
      inMemoryTimelineData,
      isTimelineSupported,
      searchInputContainerRef,
      setFile,
      viewState,
    }),
    [file, inMemoryTimelineData, isTimelineSupported, setFile, viewState],
  );

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
}

export {TimelineContext, TimelineContextController};
