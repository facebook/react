// @flow

import type {
  FlamechartData,
  ReactLane,
  ReactProfilerData,
  ReactProfilerDataV2,
} from './types';

import React, {useState, useCallback} from 'react';
import {unstable_batchedUpdates} from 'react-dom';

import {getLaneHeight} from './canvas/canvasUtils';
import {REACT_TOTAL_NUM_LANES} from './constants';
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
    (importedProfilerData: ReactProfilerData) => {
      setProfilerData(importedProfilerData);
    },
  );

  // TODO: Migrate and completely remove V2 stuff
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
