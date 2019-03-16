// @flow

import React, { useContext } from 'react';
import { ProfilerContext } from './ProfilerContext';
import { calculateSelfDuration } from './utils';
import { StoreContext } from '../context';

import styles from './CommitRanked.css';

import type { CommitDetails, CommitTree, Node } from './types';

export default function CommitRanked(_: {||}) {
  const { rendererID, rootID, selectedCommitIndex } = useContext(
    ProfilerContext
  );

  const { profilingCache } = useContext(StoreContext);

  const profilingSummary = profilingCache.ProfilingSummary.read({
    rendererID: ((rendererID: any): number),
    rootID: ((rootID: any): number),
  });

  const commitDetails = profilingCache.CommitDetails.read({
    commitIndex: ((selectedCommitIndex: any): number),
    rendererID: ((rendererID: any): number),
    rootID: ((rootID: any): number),
  });

  const commitTree = profilingCache.CommitTree.read({
    commitIndex: ((selectedCommitIndex: any): number),
    profilingSummary,
    rendererID: ((rendererID: any): number),
    rootID: ((rootID: any): number),
  });

  const chartData = generateChartData(commitTree, commitDetails);

  return 'Coming soon: Ranked';
}

type ChartNode = {|
  id: number,
  label: string,
  name: string,
  title: string,
  value: number,
|};

type ChartData = {|
  maxValue: number,
  nodes: Array<ChartNode>,
|};

const generateChartData = (
  commitTree: CommitTree,
  commitDetails: CommitDetails
): ChartData => {
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

  return {
    maxValue: maxSelfDuration,
    nodes: chartNodes.sort((a, b) => b.value - a.value),
  };
};
