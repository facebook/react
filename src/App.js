// @flow

import type {
  FlamechartData,
  ReactProfilerData,
  ReactProfilerDataV2,
} from './types';

import React, {useState, useCallback} from 'react';
import {unstable_batchedUpdates} from 'react-dom';

import {getPriorityHeight} from './canvas/canvasUtils';
import {REACT_PRIORITIES} from './canvas/constants';
import ImportPage from './ImportPage';
import CanvasPage from './CanvasPage';

export default function App() {
  const [profilerData, setProfilerData] = useState<ReactProfilerData | null>(
    null,
  );
  const [
    profilerDataV2,
    setProfilerDataV2,
  ] = useState<ReactProfilerDataV2 | null>(null);
  const [flamechart, setFlamechart] = useState<FlamechartData | null>(null);
  const [schedulerCanvasHeight, setSchedulerCanvasHeight] = useState<number>(0);

  const handleDataImported = useCallback(
    (
      importedProfilerData: ReactProfilerData,
      importedFlamechart: FlamechartData,
    ) => {
      unstable_batchedUpdates(() => {
        setSchedulerCanvasHeight(
          REACT_PRIORITIES.reduce((height, priority) => {
            return height + getPriorityHeight(importedProfilerData, priority);
          }, 0),
        );
        setProfilerData(importedProfilerData);
        setFlamechart(importedFlamechart);
      });
    },
  );

  // TODO: Migrate and completely remove V2 stuff
  const handleDataImportedV2 = useCallback(
    (
      importedProfilerData: ReactProfilerDataV2,
      importedFlamechart: FlamechartData,
    ) => {
      unstable_batchedUpdates(() => {
        setSchedulerCanvasHeight(
          REACT_PRIORITIES.reduce((height, priority) => {
            return height + getPriorityHeight(importedProfilerData, priority);
          }, 0),
        );
        setProfilerDataV2(importedProfilerData);
        setFlamechart(importedFlamechart);
      });
    },
  );

  if (profilerData && profilerDataV2 && flamechart) {
    return (
      <CanvasPage
        profilerData={profilerData}
        profilerDataV2={profilerDataV2}
        flamechart={flamechart}
        schedulerCanvasHeight={schedulerCanvasHeight}
      />
    );
  } else {
    return (
      <ImportPage
        onDataImported={handleDataImported}
        onDataImportedV2={handleDataImportedV2}
      />
    );
  }
}
