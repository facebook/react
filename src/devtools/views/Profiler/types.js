// @flow

export type CommitTreeNodeFrontend = {|
  id: number,
  children: Array<number>,
  displayName: string | null,
  key: number | string | null,
  parentID: number,
  treeBaseDuration: number,
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

export type InteractionsFrontend = Array<InteractionWithCommitsFrontend>;

export type CommitDetailsFrontend = {|
  rootID: number,
  commitIndex: number,
  actualDurations: Map<number, number>,
  interactions: Array<InteractionFrontend>,
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
|};

export type ImportedProfilingData = {|
  version: number,
  profilingOperations: Map<number, Array<Uint32Array>>,
  profilingSnapshots: Map<number, Map<number, ProfilingSnapshotNode>>,
  commitDetails: CommitDetailsFrontend,
  interactions: InteractionsFrontend,
  profilingSummary: ProfilingSummaryFrontend,
|};
