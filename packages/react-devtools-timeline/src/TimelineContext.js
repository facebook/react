/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {createContext, useCallback, useMemo, useState} from 'react';
import createDataResourceFromImportedFile from './createDataResourceFromImportedFile';

import type {HorizontalScrollStateChangeCallback, ViewState} from './types';
import type {DataResource} from './createDataResourceFromImportedFile';

export type Context = {|
  clearTimelineData: () => void,
  importTimelineData: (file: File) => void,
  timelineData: DataResource | null,
  viewState: ViewState,
|};

const TimelineContext = createContext<Context>(((null: any): Context));
TimelineContext.displayName = 'TimelineContext';

type Props = {|
  children: React$Node,
|};

function TimelineContextController({children}: Props) {
  const [timelineData, setTimelineData] = useState<DataResource | null>(null);

  const clearTimelineData = useCallback(() => {
    setTimelineData(null);
  }, []);

  const importTimelineData = useCallback((file: File) => {
    setTimelineData(createDataResourceFromImportedFile(file));
  }, []);

  // Recreate view state any time new profiling data is imported.
  const viewState = useMemo<ViewState>(() => {
    const horizontalScrollStateChangeCallbacks: Set<HorizontalScrollStateChangeCallback> = new Set();

    const horizontalScrollState = {
      offset: 0,
      length: 0,
    };

    return {
      horizontalScrollState,
      onHorizontalScrollStateChange: callback => {
        horizontalScrollStateChangeCallbacks.add(callback);
      },
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
      viewToMutableViewStateMap: new Map(),
    };
  }, [timelineData]);

  const value = useMemo(
    () => ({
      clearTimelineData,
      importTimelineData,
      timelineData,
      viewState,
    }),
    [clearTimelineData, importTimelineData, timelineData, viewState],
  );

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
}

export {TimelineContext, TimelineContextController};
