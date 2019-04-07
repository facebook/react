// @flow

import { calculateSelfDuration } from './utils';

import type { CommitDetails, CommitTree, Node } from './types';

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
  commitDetails: CommitDetails,
  commitIndex: number,
  commitTree: CommitTree,
|}): ChartData {
  const { actualDurations, rootID } = commitDetails;
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
  const walkTree = (
    id: number,
    parentOffset: number = 0,
    currentDepth: number = 1
  ) => {
    idToDepthMap.set(id, currentDepth);

    const node = ((nodes.get(id): any): Node);

    if (node == null) {
      throw Error(`Could not find node with id "${id}" in commit tree`);
    }

    const actualDuration = actualDurations.get(id) || 0;
    const selfDuration = calculateSelfDuration(id, commitTree, commitDetails);
    const didRender = actualDurations.has(id);

    const name = node.displayName || 'Unknown';
    const maybeKey = node.key !== null ? ` key="${node.key}"` : '';

    let label = `${name}${maybeKey}`;
    if (didRender) {
      label += ` (${selfDuration.toFixed(1)}ms of ${actualDuration.toFixed(
        1
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
      offset: parentOffset,
      selfDuration,
      treeBaseDuration: node.treeBaseDuration,
    };

    if (currentDepth > rows.length) {
      rows.push([chartNode]);
    } else {
      rows[currentDepth - 1].push(chartNode);
    }

    node.children.forEach(childID => {
      const childChartNode = walkTree(childID, parentOffset, currentDepth + 1);
      parentOffset += childChartNode.treeBaseDuration;
    });

    return chartNode;
  };

  // Skip over the root; we don't want to show it in the flamegraph.
  const root = ((nodes.get(rootID): any): Node);
  walkTree(root.children[0]);

  const chartData = {
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
