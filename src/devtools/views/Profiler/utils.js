// @flow

import { PROFILER_EXPORT_VERSION } from 'src/constants';

import type { ProfilingDataBackend } from 'src/backend/types';
import type {
  ProfilingDataExport,
  ProfilingDataForRootExport,
  ProfilingDataForRootFrontend,
  ProfilingDataFrontend,
  SnapshotNode,
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

// Combines info from the Store (frontend) and renderer interfaces (backend) into the format required by the Profiler UI.
// This format can then be quickly exported (and re-imported).
export function prepareProfilingDataFrontendFromBackendAndStore(
  dataBackends: Array<ProfilingDataBackend>,
  operationsByRootID: Map<number, Array<Uint32Array>>,
  screenshotsByRootID: Map<number, Map<number, string>>,
  snapshotsByRootID: Map<number, Map<number, SnapshotNode>>
): ProfilingDataFrontend {
  const dataForRoots: Map<number, ProfilingDataForRootFrontend> = new Map();

  dataBackends.forEach(dataBackend => {
    dataBackend.dataForRoots.forEach(
      ({
        commitData,
        displayName,
        initialTreeBaseDurations,
        interactionCommits,
        interactions,
        rootID,
      }) => {
        const screenshots = screenshotsByRootID.get(rootID) || null;

        const operations = operationsByRootID.get(rootID);
        if (operations == null) {
          throw Error(`Could not find profiling operations for root ${rootID}`);
        }

        const snapshots = snapshotsByRootID.get(rootID);
        if (snapshots == null) {
          throw Error(`Could not find profiling snapshots for root ${rootID}`);
        }

        dataForRoots.set(rootID, {
          commitData: commitData.map((commitDataBackend, commitIndex) => ({
            changeDescriptions:
              commitDataBackend.changeDescriptions != null
                ? new Map(commitDataBackend.changeDescriptions)
                : null,
            duration: commitDataBackend.duration,
            fiberActualDurations: new Map(
              commitDataBackend.fiberActualDurations
            ),
            fiberSelfDurations: new Map(commitDataBackend.fiberSelfDurations),
            interactionIDs: commitDataBackend.interactionIDs,
            priorityLevel: commitDataBackend.priorityLevel,
            screenshot:
              (screenshots !== null && screenshots.get(commitIndex)) || null,
            timestamp: commitDataBackend.timestamp,
          })),
          displayName,
          initialTreeBaseDurations: new Map(initialTreeBaseDurations),
          interactionCommits: new Map(interactionCommits),
          interactions: new Map(interactions),
          operations,
          rootID,
          snapshots,
        });
      }
    );
  });

  return { dataForRoots };
}

// Converts a Profiling data export into the format required by the Store.
export function prepareProfilingDataFrontendFromExport(
  profilingDataExport: ProfilingDataExport
): ProfilingDataFrontend {
  const { version } = profilingDataExport;

  if (version !== PROFILER_EXPORT_VERSION) {
    throw Error(`Unsupported profiler export version "${version}"`);
  }

  const dataForRoots: Map<number, ProfilingDataForRootFrontend> = new Map();
  profilingDataExport.dataForRoots.forEach(
    ({
      commitData,
      displayName,
      initialTreeBaseDurations,
      interactionCommits,
      interactions,
      operations,
      rootID,
      snapshots,
    }) => {
      dataForRoots.set(rootID, {
        commitData: commitData.map(
          ({
            changeDescriptions,
            duration,
            fiberActualDurations,
            fiberSelfDurations,
            interactionIDs,
            priorityLevel,
            screenshot,
            timestamp,
          }) => ({
            changeDescriptions:
              changeDescriptions != null ? new Map(changeDescriptions) : null,
            duration,
            fiberActualDurations: new Map(fiberActualDurations),
            fiberSelfDurations: new Map(fiberSelfDurations),
            interactionIDs,
            priorityLevel,
            screenshot,
            timestamp,
          })
        ),
        displayName,
        initialTreeBaseDurations: new Map(initialTreeBaseDurations),
        interactionCommits: new Map(interactionCommits),
        interactions: new Map(interactions),
        operations: operations.map(array => Uint32Array.from(array)), // Convert Array back to Uint32Array
        rootID,
        snapshots: new Map(snapshots),
      });
    }
  );

  return { dataForRoots };
}

// Converts a Store Profiling data into a format that can be safely (JSON) serialized for export.
export function prepareProfilingDataExport(
  profilingDataFrontend: ProfilingDataFrontend
): ProfilingDataExport {
  const dataForRoots: Array<ProfilingDataForRootExport> = [];
  profilingDataFrontend.dataForRoots.forEach(
    ({
      commitData,
      displayName,
      initialTreeBaseDurations,
      interactionCommits,
      interactions,
      operations,
      rootID,
      snapshots,
    }) => {
      dataForRoots.push({
        commitData: commitData.map(
          ({
            changeDescriptions,
            duration,
            fiberActualDurations,
            fiberSelfDurations,
            interactionIDs,
            priorityLevel,
            screenshot,
            timestamp,
          }) => ({
            changeDescriptions:
              changeDescriptions != null
                ? Array.from(changeDescriptions.entries())
                : null,
            duration,
            fiberActualDurations: Array.from(fiberActualDurations.entries()),
            fiberSelfDurations: Array.from(fiberSelfDurations.entries()),
            interactionIDs,
            priorityLevel,
            screenshot,
            timestamp,
          })
        ),
        displayName,
        initialTreeBaseDurations: Array.from(
          initialTreeBaseDurations.entries()
        ),
        interactionCommits: Array.from(interactionCommits.entries()),
        interactions: Array.from(interactions.entries()),
        operations: operations.map(array => Array.from(array)), // Convert Uint32Array to Array for serialization
        rootID,
        snapshots: Array.from(snapshots.entries()),
      });
    }
  );

  return {
    version: PROFILER_EXPORT_VERSION,
    dataForRoots,
  };
}

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
