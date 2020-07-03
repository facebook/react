// @flow

import type {TimelineEvent} from './speedscope/import/chrome';
import type {FlamechartData, ReactProfilerDataV2} from './types';

import React, {useEffect} from 'react';

import preprocessDataV2 from './util/preprocessDataV2';
import preprocessFlamechart from './util/preprocessFlamechart';

// TODO: Add import button but keep a static path until canvas layout is ready
import JSON_PATHV2 from 'url:../static/Profile-20200625T133129.json';

type Props = {|
  onDataImportedV2: (
    profilerData: ReactProfilerDataV2,
    flamechart: FlamechartData,
  ) => void,
|};

export default function ImportPage({onDataImportedV2}: Props) {
  useEffect(() => {
    fetch(JSON_PATHV2)
      .then(res => res.json())
      .then((events: TimelineEvent[]) => {
        // Filter null entries and sort by timestamp.
        // I would not expect to have to do either of this,
        // but some of the data being passed in requires it.
        events = events.filter(Boolean).sort((a, b) => (a.ts > b.ts ? 1 : -1));

        if (events.length > 0) {
          const processedData = preprocessDataV2(events);
          const processedFlamechart = preprocessFlamechart(events);
          onDataImportedV2(processedData, processedFlamechart);
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
