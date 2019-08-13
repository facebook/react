// @flow

import { ElementTypeForwardRef, ElementTypeMemo } from 'src/types';
import { formatDuration } from './utils';
import ProfilerStore from 'src/devtools/ProfilerStore';

import type { CommitTree } from './types';

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
  commitIndex,
  commitTree,
  profilerStore,
  rootID,
}: {|
  commitIndex: number,
  commitTree: CommitTree,
  profilerStore: ProfilerStore,
  rootID: number,
|}): ChartData {
  const commitDatum = profilerStore.getCommitData(rootID, commitIndex);

  const { fiberActualDurations, fiberSelfDurations } = commitDatum;
  const { nodes } = commitTree;

  const key = `${rootID}-${commitIndex}`;
  if (cachedChartData.has(key)) {
    return ((cachedChartData.get(key): any): ChartData);
  }

  let maxSelfDuration = 0;

  const chartNodes: Array<ChartNode> = [];
  fiberActualDurations.forEach((actualDuration, id) => {
    const node = nodes.get(id);

    if (node == null) {
      throw Error(`Could not find node with id "${id}" in commit tree`);
    }

    const { displayName, key, parentID, type } = node;

    // Don't show the root node in this chart.
    if (parentID === 0) {
      return;
    }
    const selfDuration = fiberSelfDurations.get(id) || 0;
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
