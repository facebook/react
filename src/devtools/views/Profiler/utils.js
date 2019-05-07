// @flow

import { PROFILER_EXPORT_VERSION } from 'src/constants';

import type {
  CommitDetailsFrontend,
  CommitTreeFrontend,
  ProfilingSnapshotNode,
} from './types';

const commitGradient = [
  'var(--color-commit-gradient-0)',
  'var(--color-commit-gradient-1)',
  'var(--color-commit-gradient-2)',
  'var(--color-commit-gradient-3)',
  'var(--color-commit-gradient-4)',
  'var(--color-commit-gradient-5)',
  'var(--color-commit-gradient-6)',
  'var(--color-commit-gradient-7)',
  'var(--color-commit-gradient-8)',
  'var(--color-commit-gradient-9)',
];

export const calculateSelfDuration = (
  id: number,
  commitTree: CommitTreeFrontend,
  commitDetails: CommitDetailsFrontend
): number => {
  const { actualDurations } = commitDetails;
  const { nodes } = commitTree;

  if (!actualDurations.has(id)) {
    return 0;
  }

  const node = nodes.get(id);
  if (node == null) {
    throw Error(`Could not find node with id "${id}" in commit tree`);
  }

  let selfDuration = actualDurations.get(id) || 0;

  node.children.forEach(childID => {
    if (actualDurations.has(childID)) {
      selfDuration -= actualDurations.get(childID) || 0;
    }
  });

  return selfDuration;
};

export const prepareProfilingExport = (
  profilingOperations: Map<number, Array<Uint32Array>>,
  profilingSnapshots: Map<number, Map<number, ProfilingSnapshotNode>>,
  rendererID: number,
  rootID: number
) => {
  const profilingOperationsForRoot = [];
  const operations = profilingOperations.get(rootID);
  if (operations != null) {
    operations.forEach(operations => {
      // Convert typed Array before JSON serialization, or it will be converted to an Object.
      profilingOperationsForRoot.push(Array.from<number>(operations));
    });
  }

  // Convert Map to Object or JSON.stringify will clobber the contents.
  const profilingSnapshotsForRoot = {};
  const profilingSnapshotsMap = profilingSnapshots.get(rootID);
  if (profilingSnapshotsMap != null) {
    for (let [id, snapshot] of profilingSnapshotsMap.entries()) {
      profilingSnapshotsForRoot[id] = snapshot;
    }
  }

  return {
    profilingOperations: profilingOperationsForRoot,
    profilingSnapshots: profilingSnapshotsForRoot,
    rendererID,
    rootID,
  };
};

export const prepareProfilingImport = (raw: string) => {
  const parsed = JSON.parse(raw);

  if (parsed.version !== PROFILER_EXPORT_VERSION) {
    throw Error(`Unsupported profiler export version "${parsed.version}".`);
  }

  const entries = [];
  Object.values(parsed.profilingSnapshots).forEach(snapshot => {
    entries.push([(snapshot: any).id, snapshot]);
  });

  const rootID = parsed.profilingSummary.rootID;
  parsed.profilingOperations = new Map([[rootID, parsed.profilingOperations]]);
  parsed.profilingSnapshots = new Map([[rootID, new Map(entries)]]);
  return parsed;
};

export const getGradientColor = (value: number) => {
  const maxIndex = commitGradient.length - 1;
  let index;
  if (Number.isNaN(value)) {
    index = 0;
  } else if (!Number.isFinite(value)) {
    index = maxIndex;
  } else {
    index = Math.max(0, Math.min(maxIndex, value)) * maxIndex;
  }
  return commitGradient[Math.round(index)];
};

export const formatDuration = (duration: number) =>
  Math.round(duration * 10) / 10;
export const formatPercentage = (percentage: number) =>
  Math.round(percentage * 100);
export const formatTime = (timestamp: number) =>
  Math.round(Math.round(timestamp) / 100) / 10;

export const scale = (
  minValue: number,
  maxValue: number,
  minRange: number,
  maxRange: number
) => (value: number, fallbackValue: number) =>
  maxValue - minValue === 0
    ? fallbackValue
    : ((value - minValue) / (maxValue - minValue)) * (maxRange - minRange);
