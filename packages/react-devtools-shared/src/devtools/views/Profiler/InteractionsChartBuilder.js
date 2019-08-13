// @flow

import ProfilerStore from 'src/devtools/ProfilerStore';

import type { Interaction } from './types';

export type ChartData = {|
  interactions: Array<Interaction>,
  lastInteractionTime: number,
  maxCommitDuration: number,
|};

const cachedChartData: Map<number, ChartData> = new Map();

export function getChartData({
  profilerStore,
  rootID,
}: {|
  profilerStore: ProfilerStore,
  rootID: number,
|}): ChartData {
  if (cachedChartData.has(rootID)) {
    return ((cachedChartData.get(rootID): any): ChartData);
  }

  const dataForRoot = profilerStore.getDataForRoot(rootID);
  if (dataForRoot == null) {
    throw Error(`Could not find profiling data for root "${rootID}"`);
  }

  const { commitData, interactions } = dataForRoot;

  const lastInteractionTime =
    commitData.length > 0 ? commitData[commitData.length - 1].timestamp : 0;

  let maxCommitDuration = 0;

  commitData.forEach(commitDatum => {
    maxCommitDuration = Math.max(maxCommitDuration, commitDatum.duration);
  });

  const chartData = {
    interactions: Array.from(interactions.values()),
    lastInteractionTime,
    maxCommitDuration,
  };

  cachedChartData.set(rootID, chartData);

  return chartData;
}

export function invalidateChartData(): void {
  cachedChartData.clear();
}
