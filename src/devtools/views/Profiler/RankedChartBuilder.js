// @flow

import { calculateSelfDuration } from './utils';

import type { CommitDetails, CommitTree, Node } from './types';

export type ChartNode = {|
  id: number,
  label: string,
  name: string,
  title: string,
  value: number,
|};

export type ChartData = {|
  maxValue: number,
  nodes: Array<ChartNode>,
|};

const cachedChartData: Map<string, ChartData> = new Map();

export function getChartData({
  commitDetails,
  commitIndex,
  commitTree,
  rootID,
}: {|
  commitDetails: CommitDetails,
  commitIndex: number,
  commitTree: CommitTree,
  rootID: number,
|}): ChartData {
  const key = `${rootID}-${commitIndex}`;

  if (cachedChartData.has(key)) {
    return ((cachedChartData.get(key): any): ChartData);
  }

  const { nodes } = commitTree;

  let maxSelfDuration = 0;

  const chartNodes: Array<ChartNode> = [];
  commitDetails.actualDurations.forEach((actualDuration, id) => {
    const node = ((nodes.get(id): any): Node);

    // Don't show the root node in this chart.
    if (node.parentID === 0) {
      return;
    }

    const selfDuration = calculateSelfDuration(id, commitTree, commitDetails);
    maxSelfDuration = Math.max(maxSelfDuration, selfDuration);

    const name = node.displayName || 'Unknown';
    const label = `${name} (${selfDuration.toFixed(1)}ms)`;
    chartNodes.push({
      id,
      label,
      name,
      title: label,
      value: selfDuration,
    });
  });

  const chartData = {
    maxValue: maxSelfDuration,
    nodes: chartNodes.sort((a, b) => b.value - a.value),
  };

  cachedChartData.set(key, chartData);

  return chartData;
}

export function invalidateChartData(): void {
  cachedChartData.clear();
}
