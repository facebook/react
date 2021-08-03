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

import type {DataResource} from './createDataResourceFromImportedFile';

export type Context = {|
  clearSchedulingProfilerData: () => void,
  importSchedulingProfilerData: (file: File) => void,
  schedulingProfilerData: DataResource | null,
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

  // TODO (scheduling profiler) Start/stop time ref here?

  const value = useMemo(
    () => ({
      clearSchedulingProfilerData,
      importSchedulingProfilerData,
      schedulingProfilerData,
      // TODO (scheduling profiler)
    }),
    [
      clearSchedulingProfilerData,
      importSchedulingProfilerData,
      schedulingProfilerData,
      // TODO (scheduling profiler)
    ],
  );

  return (
    <SchedulingProfilerContext.Provider value={value}>
      {children}
    </SchedulingProfilerContext.Provider>
  );
}

export {SchedulingProfilerContext, SchedulingProfilerContextController};
