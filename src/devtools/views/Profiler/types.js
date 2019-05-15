// @flow

import type { ElementType } from 'src/types';
import type {
  CommitDetailsBackend,
  InteractionsBackend,
  ProfilingSummaryBackend,
  ReactPriorityLevel,
} from 'src/backend/types';

export type CommitTreeNodeFrontend = {|
  id: number,
  children: Array<number>,
  displayName: string | null,
  key: number | string | null,
  parentID: number,
  treeBaseDuration: number,
  type: ElementType,
|};

export type CommitTreeFrontend = {|
  nodes: Map<number, CommitTreeNodeFrontend>,
  rootID: number,
|};

export type InteractionFrontend = {|
  id: number,
  name: string,
  timestamp: number,
|};

export type InteractionWithCommitsFrontend = {|
  ...InteractionFrontend,
  commits: Array<number>,
|};

export type InteractionsFrontend = {|
  interactions: Array<InteractionWithCommitsFrontend>,
  rootID: number,
|};

export type CommitDetailsFrontend = {|
  actualDurations: Map<number, number>,
  commitIndex: number,
  interactions: Array<InteractionFrontend>,
  priorityLevel: ReactPriorityLevel | null,
  rootID: number,
  selfDurations: Map<number, number>,
|};

export type FiberCommitsFrontend = {|
  commitDurations: Array<number>,
  fiberID: number,
  rootID: number,
|};

export type ProfilingSummaryFrontend = {|
  rootID: number,

  // Commit durations
  commitDurations: Array<number>,

  // Commit times (relative to when profiling started)
  commitTimes: Array<number>,

  // Map of fiber id to (initial) tree base duration
  initialTreeBaseDurations: Map<number, number>,

  interactionCount: number,
|};

export type ProfilingSnapshotNode = {|
  id: number,
  children: Array<number>,
  displayName: string | null,
  key: number | string | null,
  type: ElementType,
|};

export type ImportedProfilingData = {|
  version: 3,
  profilingOperations: Map<number, Array<Uint32Array>>,
  profilingSnapshots: Map<number, Map<number, ProfilingSnapshotNode>>,
  commitDetails: Array<CommitDetailsFrontend>,
  interactions: InteractionsFrontend,
  profilingSummary: ProfilingSummaryFrontend,
|};

export type SerializableProfilingDataOperationsByRootID = Array<
  [number, Array<Array<number>>]
>;
export type SerializableProfilingDataSnapshotsByRootID = Array<
  [number, Array<[number, ProfilingSnapshotNode]>]
>;

export type ExportedProfilingSummaryFromFrontend = {|
  version: 3,
  profilingOperationsByRootID: SerializableProfilingDataOperationsByRootID,
  profilingSnapshotsByRootID: SerializableProfilingDataSnapshotsByRootID,
  rendererID: number,
  rootID: number,
|};

export type ExportedProfilingData = {|
  version: 3,
  profilingOperationsByRootID: SerializableProfilingDataOperationsByRootID,
  profilingSnapshotsByRootID: SerializableProfilingDataSnapshotsByRootID,
  commitDetails: Array<CommitDetailsBackend>,
  interactions: InteractionsBackend,
  profilingSummary: ProfilingSummaryBackend,
|};
