// @flow

import { calculateSelfDuration } from './utils';

import type { CommitDetailsFrontend, CommitTreeFrontend } from './types';

export type ChartNode = {|
  id: number,
  label: string,
  name: string,
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
}: {|
  commitDetails: CommitDetailsFrontend,
  commitIndex: number,
  commitTree: CommitTreeFrontend,
|}): ChartData {
  const { actualDurations, rootID } = commitDetails;
  const { nodes } = commitTree;

  const key = `${rootID}-${commitIndex}`;
  if (cachedChartData.has(key)) {
    return ((cachedChartData.get(key): any): ChartData);
  }

  let maxSelfDuration = 0;

  const chartNodes: Array<ChartNode> = [];
  actualDurations.forEach((actualDuration, id) => {
    const node = nodes.get(id);

    if (node == null) {
      throw Error(`Could not find node with id "${id}" in commit tree`);
    }

    // Don't show the root node in this chart.
    if (node.parentID === 0) {
      return;
    }

    const selfDuration = calculateSelfDuration(id, commitTree, commitDetails);
    maxSelfDuration = Math.max(maxSelfDuration, selfDuration);

    const name = node.displayName || 'Unknown';
    const maybeKey = node.key !== null ? ` key="${node.key}"` : '';
    const label = `${name}${maybeKey} (${selfDuration.toFixed(1)}ms)`;
    chartNodes.push({
      id,
      label,
      name,
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
