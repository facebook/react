// @flow

import {importFromChromeTimeline, Flamechart} from '@elg/speedscope';

import type {TimelineEvent} from '@elg/speedscope';
import type {FlamechartData} from '../types';

export default function preprocessFlamechart(
  rawData: TimelineEvent[],
): FlamechartData {
  const parsedData = importFromChromeTimeline(rawData, 'react-devtools');
  const profile = parsedData.profiles[0]; // TODO Choose the main CPU thread only
  const flamechart = new Flamechart({
    getTotalWeight: profile.getTotalWeight.bind(profile),
    forEachCall: profile.forEachCall.bind(profile),
    formatValue: profile.formatValue.bind(profile),
    getColorBucketForFrame: () => null,
  });

  return flamechart;
}
