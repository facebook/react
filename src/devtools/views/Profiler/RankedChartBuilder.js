// @flow

import { ElementTypeForwardRef, ElementTypeMemo } from 'src/types';
import { formatDuration } from './utils';

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
  const { actualDurations, rootID, selfDurations } = commitDetails;
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

    const { displayName, key, parentID, type } = node;

    // Don't show the root node in this chart.
    if (parentID === 0) {
      return;
    }
    const selfDuration = selfDurations.get(id) || 0;
    maxSelfDuration = Math.max(maxSelfDuration, selfDuration);

    const name = displayName || 'Anonymous';
    const maybeKey = key !== null ? ` key="${key}"` : '';

    let maybeBadge = '';
    if (type === ElementTypeForwardRef) {
      maybeBadge = ' (ForwardRef)';
    } else if (type === ElementTypeMemo) {
      maybeBadge = ' (Memo)';
    }

    const label = `${name}${maybeBadge}${maybeKey} (${formatDuration(
      selfDuration
    )}ms)`;
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
