// @flow

import type {FlamechartData, ReactLane, ReactProfilerDataV2} from './types';

import React, {useState, useCallback} from 'react';
import {unstable_batchedUpdates} from 'react-dom';

import {getLaneHeight} from './canvas/canvasUtils';
import {REACT_TOTAL_NUM_LANES} from './constants';
import ImportPage from './ImportPage';
import CanvasPage from './CanvasPage';

export default function App() {
  const [
    profilerDataV2,
    setProfilerDataV2,
  ] = useState<ReactProfilerDataV2 | null>(null);
  const [flamechart, setFlamechart] = useState<FlamechartData | null>(null);
  const [schedulerCanvasHeight, setSchedulerCanvasHeight] = useState<number>(0);

  const handleDataImportedV2 = useCallback(
    (
      importedProfilerData: ReactProfilerDataV2,
      importedFlamechart: FlamechartData,
    ) => {
      unstable_batchedUpdates(() => {
        setProfilerDataV2(importedProfilerData);
        setFlamechart(importedFlamechart);

        const lanesToRender: ReactLane[] = Array.from(
          Array(REACT_TOTAL_NUM_LANES).keys(),
        );
        // TODO: Figure out if this is necessary
        setSchedulerCanvasHeight(
          lanesToRender.reduce((height, lane) => {
            return height + getLaneHeight(importedProfilerData, lane);
          }, 0),
        );
      });
    },
  );

  if (profilerDataV2 && flamechart) {
    return (
      <CanvasPage
        profilerDataV2={profilerDataV2}
        flamechart={flamechart}
        schedulerCanvasHeight={schedulerCanvasHeight}
      />
    );
  } else {
    return <ImportPage onDataImportedV2={handleDataImportedV2} />;
  }
}
