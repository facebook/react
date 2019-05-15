// @flow

import { PROFILER_EXPORT_VERSION } from 'src/constants';
import {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  LowPriority,
  IdlePriority,
  NoPriority,
} from 'src/backend/types';

import type {
  ExportedProfilingSummaryFromFrontend,
  ExportedProfilingData,
  ImportedProfilingData,
  ProfilingSnapshotNode,
} from './types';

import type {
  ExportedProfilingDataFromRenderer,
  ReactPriorityLevel,
} from 'src/backend/types';

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

export const prepareExportedProfilingSummary = (
  profilingOperations: Map<number, Array<Uint32Array>>,
  profilingSnapshots: Map<number, Map<number, ProfilingSnapshotNode>>,
  rendererID: number,
  rootID: number
) => {
  const profilingOperationsForRoot = [];
  const operations = profilingOperations.get(rootID);
  if (operations != null) {
    operations.forEach(operationsTypedArray => {
      // Convert typed array to plain array before JSON serialization, or it will be converted to an Object.
      const operationsPlainArray = Array.from(operationsTypedArray);
      profilingOperationsForRoot.push(operationsPlainArray);
    });
  }

  // Convert Map to Array of key-value pairs or JSON.stringify will clobber the contents.
  const profilingSnapshotsForRoot = [];
  const profilingSnapshotsMap = profilingSnapshots.get(rootID);
  if (profilingSnapshotsMap != null) {
    for (const [elementID, snapshotNode] of profilingSnapshotsMap.entries()) {
      profilingSnapshotsForRoot.push([elementID, snapshotNode]);
    }
  }

  const exportedProfilingSummary: ExportedProfilingSummaryFromFrontend = {
    version: PROFILER_EXPORT_VERSION,
    profilingOperationsByRootID: [[rootID, profilingOperationsForRoot]],
    profilingSnapshotsByRootID: [[rootID, profilingSnapshotsForRoot]],
    rendererID,
    rootID,
  };
  return exportedProfilingSummary;
};

export const prepareExportedProfilingData = (
  exportedProfilingDataFromRenderer: ExportedProfilingDataFromRenderer,
  exportedProfilingSummary: ExportedProfilingSummaryFromFrontend
): ExportedProfilingData => {
  if (exportedProfilingDataFromRenderer.version !== PROFILER_EXPORT_VERSION) {
    throw new Error(
      `Unsupported profiling data version ${
        exportedProfilingDataFromRenderer.version
      } from renderer with id "${exportedProfilingSummary.rendererID}"`
    );
  }
  if (exportedProfilingSummary.version !== PROFILER_EXPORT_VERSION) {
    throw new Error(
      `Unsupported profiling summary version ${
        exportedProfilingSummary.version
      } from renderer with id "${exportedProfilingSummary.rendererID}"`
    );
  }
  const exportedProfilingData: ExportedProfilingData = {
    version: PROFILER_EXPORT_VERSION,
    profilingSummary: exportedProfilingDataFromRenderer.profilingSummary,
    commitDetails: exportedProfilingDataFromRenderer.commitDetails,
    interactions: exportedProfilingDataFromRenderer.interactions,
    profilingOperationsByRootID:
      exportedProfilingSummary.profilingOperationsByRootID,
    profilingSnapshotsByRootID:
      exportedProfilingSummary.profilingSnapshotsByRootID,
  };
  return exportedProfilingData;
};

/**
 * This function should mirror `prepareExportedProfilingData` and `prepareExportedProfilingSummary`.
 */
export const prepareImportedProfilingData = (
  exportedProfilingDataJsonString: string
) => {
  const parsed = JSON.parse(exportedProfilingDataJsonString);

  if (parsed.version !== PROFILER_EXPORT_VERSION) {
    throw Error(`Unsupported profiler export version "${parsed.version}".`);
  }

  // Some "exported" types in `parsed` are `...Backend`, see `prepareExportedProfilingData`,
  // they come to `ExportedProfilingData` from `ExportedProfilingDataFromRenderer`.
  // But the "imported" types in `ImportedProfilingData` are `...Frontend`,
  // and some of them aren't exactly the same as `...Backend` (i.e. an interleaved array versus a map).
  // The type annotations here help us to spot the incompatibilities and properly convert.

  const exportedProfilingData: ExportedProfilingData = parsed;

  const profilingSummaryExported = exportedProfilingData.profilingSummary;
  const initialTreeBaseDurations =
    profilingSummaryExported.initialTreeBaseDurations;
  const initialTreeBaseDurationsMap = new Map();
  for (let i = 0; i < initialTreeBaseDurations.length; i += 2) {
    const fiberID = initialTreeBaseDurations[i];
    const initialTreeBaseDuration = initialTreeBaseDurations[i + 1];
    initialTreeBaseDurationsMap.set(fiberID, initialTreeBaseDuration);
  }

  const importedProfilingData: ImportedProfilingData = {
    version: parsed.version,
    profilingOperations: new Map(
      exportedProfilingData.profilingOperationsByRootID.map(
        ([rootID, profilingOperationsForRoot]) => [
          rootID,
          profilingOperationsForRoot.map(operations =>
            Uint32Array.from(operations)
          ),
        ]
      )
    ),
    profilingSnapshots: new Map(
      exportedProfilingData.profilingSnapshotsByRootID.map(
        ([rootID, profilingSnapshotsForRoot]) => [
          rootID,
          new Map(profilingSnapshotsForRoot),
        ]
      )
    ),
    commitDetails: exportedProfilingData.commitDetails.map(
      commitDetailsBackendItem => {
        const durations = commitDetailsBackendItem.durations;
        const actualDurationsMap = new Map<number, number>();
        const selfDurationsMap = new Map<number, number>();
        for (let i = 0; i < durations.length; i += 3) {
          const fiberID = durations[i];
          actualDurationsMap.set(fiberID, durations[i + 1]);
          selfDurationsMap.set(fiberID, durations[i + 2]);
        }
        return {
          actualDurations: actualDurationsMap,
          commitIndex: commitDetailsBackendItem.commitIndex,
          interactions: commitDetailsBackendItem.interactions,
          priorityLevel: commitDetailsBackendItem.priorityLevel,
          rootID: commitDetailsBackendItem.rootID,
          selfDurations: selfDurationsMap,
        };
      }
    ),
    interactions: exportedProfilingData.interactions,
    profilingSummary: {
      rootID: profilingSummaryExported.rootID,
      commitDurations: profilingSummaryExported.commitDurations,
      commitTimes: profilingSummaryExported.commitTimes,
      initialTreeBaseDurations: initialTreeBaseDurationsMap,
      interactionCount: profilingSummaryExported.interactionCount,
    },
  };
  return importedProfilingData;
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

export const formatPriorityLevel = (priorityLevel: ReactPriorityLevel) => {
  switch (priorityLevel) {
    case ImmediatePriority:
      return 'Immediate';
    case UserBlockingPriority:
      return 'User-Blocking';
    case NormalPriority:
      return 'Normal';
    case LowPriority:
      return 'Low';
    case IdlePriority:
      return 'Idle';
    case NoPriority:
    default:
      return 'Unknown';
  }
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
