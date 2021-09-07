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
  clearSchedulingProfilerData: () => void,
  importSchedulingProfilerData: (file: File) => void,
  schedulingProfilerData: DataResource | null,
  viewState: ViewState,
|};

const SchedulingProfilerContext = createContext<Context>(
  ((null: any): Context),
);
SchedulingProfilerContext.displayName = 'SchedulingProfilerContext';

type Props = {|
  children: React$Node,
|};

function SchedulingProfilerContextController({children}: Props) {
  const [
    schedulingProfilerData,
    setSchedulingProfilerData,
  ] = useState<DataResource | null>(null);

  const clearSchedulingProfilerData = useCallback(() => {
    setSchedulingProfilerData(null);
  }, []);

  const importSchedulingProfilerData = useCallback((file: File) => {
    setSchedulingProfilerData(createDataResourceFromImportedFile(file));
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
  }, [schedulingProfilerData]);

  const value = useMemo(
    () => ({
      clearSchedulingProfilerData,
      importSchedulingProfilerData,
      schedulingProfilerData,
      viewState,
    }),
    [
      clearSchedulingProfilerData,
      importSchedulingProfilerData,
      schedulingProfilerData,
      viewState,
    ],
  );

  return (
    <SchedulingProfilerContext.Provider value={value}>
      {children}
    </SchedulingProfilerContext.Provider>
  );
}

export {SchedulingProfilerContext, SchedulingProfilerContextController};
