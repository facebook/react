// @flow

import type {FlamechartData, ReactProfilerData} from './types';

import React, {useState, useCallback} from 'react';
import {unstable_batchedUpdates} from 'react-dom';

import ImportPage from './ImportPage';
import CanvasPage from './CanvasPage';

export default function App() {
  const [profilerData, setProfilerData] = useState<ReactProfilerData | null>(
    null,
  );
  const [flamechart, setFlamechart] = useState<FlamechartData | null>(null);

  const handleDataImported = useCallback(
    (
      importedProfilerData: ReactProfilerData,
      importedFlamechart: FlamechartData,
    ) => {
      unstable_batchedUpdates(() => {
        setProfilerData(importedProfilerData);
        setFlamechart(importedFlamechart);
      });
    },
  );
  if (profilerData && flamechart) {
    return <CanvasPage profilerData={profilerData} flamechart={flamechart} />;
  } else {
    return <ImportPage onDataImported={handleDataImported} />;
  }
}
