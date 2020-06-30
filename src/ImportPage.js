// @flow

import type {TimelineEvent} from './speedscope/import/chrome';
import type {FlamechartData, ReactProfilerDataV2} from './types';

import React, {useEffect} from 'react';

import preprocessData from './util/preprocessData';
// import preprocessDataNew from './util/preprocessDataV2';
import preprocessFlamechart from './util/preprocessFlamechart';

// TODO: Add import button but keep a static path until canvas layout is ready
import JSON_PATH from 'url:../static/small-devtools.json';

type Props = {|
  onDataImported: (
    profilerData: ReactProfilerDataV2,
    flamechart: FlamechartData,
  ) => void,
|};

export default function ImportPage({onDataImported}: Props) {
  useEffect(() => {
    fetch(JSON_PATH)
      .then(res => res.json())
      .then((events: TimelineEvent[]) => {
        // Filter null entries and sort by timestamp.
        // I would not expect to have to do either of this,
        // but some of the data being passed in requires it.
        events = events.filter(Boolean).sort((a, b) => (a.ts > b.ts ? 1 : -1));

        if (events.length > 0) {
          // TODO: Remove old preprocessData call
          // const processedDataNew = preprocessDataNew(events);
          const processedData = preprocessData(events);
          const processedFlamechart = preprocessFlamechart(events);
          onDataImported(processedData, processedFlamechart);
        }
      });
  }, []);

  return (
    <div>
      LOADING. TODO: Turn this into an import page. This page currently just
      immediately loads a JSON file.
    </div>
  );
}
