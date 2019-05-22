// @flow

import type { ElementType } from 'src/types';

export type CommitTreeNode = {|
  id: number,
  children: Array<number>,
  displayName: string | null,
  key: number | string | null,
  parentID: number,
  treeBaseDuration: number,
  type: ElementType,
|};

export type CommitTree = {|
  nodes: Map<number, CommitTreeNode>,
  rootID: number,
|};

export type Interaction = {|
  id: number,
  name: string,
  timestamp: number,
|};

export type SnapshotNode = {|
  id: number,
  children: Array<number>,
  displayName: string | null,
  key: number | string | null,
  type: ElementType,
|};

export type CommitDataFrontend = {|
  // How long was this commit?
  duration: number,

  // Map of Fiber (ID) to actual duration for this commit;
  // Fibers that did not render will not have entries in this Map.
  fiberActualDurations: Map<number, number>,

  // Map of Fiber (ID) to "self duration" for this commit;
  // Fibers that did not render will not have entries in this Map.
  fiberSelfDurations: Map<number, number>,

  // Which interactions (IDs) were associated with this commit.
  interactionIDs: Array<number>,

  // Priority level of the commit (if React provided this info)
  priorityLevel: string | null,

  // Screenshot data for this commit (if available).
  screenshot: string | null,

  // When did this commit occur (relative to the start of profiling)
  timestamp: number,
|};

export type ProfilingDataForRootFrontend = {|
  // Timing, duration, and other metadata about each commit.
  commitData: Array<CommitDataFrontend>,

  // Display name of the nearest descendant component (ideally a function or class component).
  // This value is used by the root selector UI.
  displayName: string,

  // Map of fiber id to (initial) tree base duration when Profiling session was started.
  // This info can be used along with commitOperations to reconstruct the tree for any commit.
  initialTreeBaseDurations: Map<number, number>,

  // All interactions recorded (for this root) during the current session.
  interactionCommits: Map<number, Array<number>>,

  // All interactions recorded (for this root) during the current session.
  interactions: Map<number, Interaction>,

  // List of tree mutation that occur during profiling.
  // These mutations can be used along with initial snapshots to reconstruct the tree for any commit.
  operations: Array<Uint32Array>,

  // Identifies the root this profiler data corresponds to.
  rootID: number,

  // Map of fiber id to node when the Profiling session was started.
  // This info can be used along with commitOperations to reconstruct the tree for any commit.
  snapshots: Map<number, SnapshotNode>,
|};

// Combination of profiling data collected by the renderer interface (backend) and Store (frontend).
export type ProfilingDataFrontend = {|
  // Profiling data per root.
  dataForRoots: Map<number, ProfilingDataForRootFrontend>,
|};

export type CommitDataExport = {|
  duration: number,
  // Tuple of fiber ID and actual duration
  fiberActualDurations: Array<[number, number]>,
  // Tuple of fiber ID and computed "self" duration
  fiberSelfDurations: Array<[number, number]>,
  interactionIDs: Array<number>,
  priorityLevel: string | null,
  screenshot: string | null,
  timestamp: number,
|};

export type ProfilingDataForRootExport = {|
  commitData: Array<CommitDataExport>,
  displayName: string,
  // Tuple of Fiber ID and base duration
  initialTreeBaseDurations: Array<[number, number]>,
  // Tuple of Interaction ID and commit indices
  interactionCommits: Array<[number, Array<number>]>,
  interactions: Array<[number, Interaction]>,
  operations: Array<Array<number>>,
  rootID: number,
  snapshots: Array<[number, SnapshotNode]>,
|};

// Serializable vefrsion of ProfilingDataFrontend data.
export type ProfilingDataExport = {|
  version: 4,
  dataForRoots: Array<ProfilingDataForRootExport>,
|};
