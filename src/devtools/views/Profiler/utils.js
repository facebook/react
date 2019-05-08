// @flow

import type { CommitDetailsFrontend, CommitTreeFrontend } from './types';

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
  Math.round(duration * 10) / 10 || '<0.1';
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
