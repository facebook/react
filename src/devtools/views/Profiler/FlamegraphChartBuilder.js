// @flow

import { ElementTypeForwardRef, ElementTypeMemo } from 'src/types';
import { formatDuration } from './utils';

import type { CommitDetailsFrontend, CommitTreeFrontend } from './types';

export type ChartNode = {|
  actualDuration: number,
  didRender: boolean,
  id: number,
  label: string,
  name: string,
  offset: number,
  selfDuration: number,
  treeBaseDuration: number,
|};

export type ChartData = {|
  baseDuration: number,
  depth: number,
  idToDepthMap: Map<number, number>,
  maxSelfDuration: number,
  rows: Array<Array<ChartNode>>,
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

  const idToDepthMap: Map<number, number> = new Map();
  const rows: Array<Array<ChartNode>> = [];

  let maxDepth = 0;
  let maxSelfDuration = 0;

  // Generate flame graph structure using tree base durations.
  const walkTree = (id: number, rightOffset: number, currentDepth: number) => {
    idToDepthMap.set(id, currentDepth);

    const node = nodes.get(id);
    if (node == null) {
      throw Error(`Could not find node with id "${id}" in commit tree`);
    }

    const { children, displayName, key, treeBaseDuration, type } = node;

    const actualDuration = actualDurations.get(id) || 0;
    const selfDuration = selfDurations.get(id) || 0;
    const didRender = actualDurations.has(id);

    const name = displayName || 'Anonymous';
    const maybeKey = key !== null ? ` key="${key}"` : '';

    let maybeBadge = '';
    if (type === ElementTypeForwardRef) {
      maybeBadge = ' (ForwardRef)';
    } else if (type === ElementTypeMemo) {
      maybeBadge = ' (Memo)';
    }

    let label = `${name}${maybeBadge}${maybeKey}`;
    if (didRender) {
      label += ` (${formatDuration(selfDuration)}ms of ${formatDuration(
        actualDuration
      )}ms)`;
    }

    maxDepth = Math.max(maxDepth, currentDepth);
    maxSelfDuration = Math.max(maxSelfDuration, selfDuration);

    const chartNode: ChartNode = {
      actualDuration,
      didRender,
      id,
      label,
      name,
      offset: rightOffset - treeBaseDuration,
      selfDuration,
      treeBaseDuration,
    };

    if (currentDepth > rows.length) {
      rows.push([chartNode]);
    } else {
      rows[currentDepth - 1].push(chartNode);
    }

    for (let i = children.length - 1; i >= 0; i--) {
      const childID = children[i];
      const childChartNode = walkTree(childID, rightOffset, currentDepth + 1);
      rightOffset -= childChartNode.treeBaseDuration;
    }

    return chartNode;
  };

  // Skip over the root; we don't want to show it in the flamegraph.
  const root = nodes.get(rootID);
  if (root == null) {
    throw Error(`Could not find root node with id "${rootID}" in commit tree`);
  }

  // Don't assume a single root.
  // Component filters or Fragments might lead to multiple "roots" in a flame graph.
  let baseDuration = 0;
  for (let i = root.children.length - 1; i >= 0; i--) {
    const id = root.children[i];
    const node = nodes.get(id);
    if (node == null) {
      throw Error(`Could not find node with id "${id}" in commit tree`);
    }
    baseDuration += node.treeBaseDuration;
    walkTree(id, baseDuration, 1);
  }

  const chartData = {
    baseDuration,
    depth: maxDepth,
    idToDepthMap,
    maxSelfDuration,
    rows,
  };

  cachedChartData.set(key, chartData);

  return chartData;
}

export function invalidateChartData(): void {
  cachedChartData.clear();
}
