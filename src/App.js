// @flow

import type {FlamechartData, ReactProfilerDataV2} from './types';

import React, {useState, useCallback} from 'react';
import {unstable_batchedUpdates} from 'react-dom';

import {getPriorityHeight} from './canvas/canvasUtils';
import {REACT_PRIORITIES} from './canvas/constants';
import ImportPage from './ImportPage';
import CanvasPage from './CanvasPage';

export default function App() {
  const [profilerData, setProfilerData] = useState<ReactProfilerDataV2 | null>(
    null,
  );
  const [flamechart, setFlamechart] = useState<FlamechartData | null>(null);
  const [schedulerCanvasHeight, setSchedulerCanvasHeight] = useState<number>(0);

  const handleDataImported = useCallback(
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
        setProfilerData(importedProfilerData);
        setFlamechart(importedFlamechart);
      });
    },
  );

  if (profilerData && flamechart) {
    return (
      <CanvasPage
        profilerData={profilerData}
        flamechart={flamechart}
        schedulerCanvasHeight={schedulerCanvasHeight}
      />
    );
  } else {
    return <ImportPage onDataImported={handleDataImported} />;
  }
}
