// @flow

export type Node = {|
  id: number,
  children: Array<number>,
  displayName: string | null,
  key: number | string | null,
  parentID: number,
  treeBaseDuration: number,
|};

export type CommitTree = {|
  nodes: Map<number, Node>,
  rootID: number,
|};

export type Interaction = {|
  id: number,
  name: string,
  timestamp: number,
|};

export type InteractionWithCommits = {|
  ...Interaction,
  commits: Array<number>,
|};

export type Interactions = Array<InteractionWithCommits>;

export type CommitDetails = {|
  rootID: number,
  commitIndex: number,
  actualDurations: Map<number, number>,
  interactions: Array<Interaction>,
|};

export type ProfilingSummary = {|
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
  profilingSnapshot: Map<number, ProfilingSnapshotNode>,
  commitDetails: CommitDetails,
  interactions: Interactions,
  profilingSummary: ProfilingSummary,
|};
