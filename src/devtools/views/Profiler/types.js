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
  actualDurations: Map<number, number>,
  interactions: Array<Interaction>,
|};

export type ProfilingSummary = {|
  // Commit durations
  commitDurations: Array<number>,

  // Commit times (relative to when profiling started)
  commitTimes: Array<number>,

  // Map of fiber id to (initial) tree base duration
  initialTreeBaseDurations: Map<number, number>,

  interactionCount: number,
|};
