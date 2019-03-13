// @flow

// Map of root ID to commit durations.
// Roots that were committed during the profiling session will have a non-empty array of values.
// Each value in the array represents the total amount of time the commit took.
// More detailed information about a commit must be requested separately.
export type CommitDurationsMap = Map<number, Array<number>>;

export type Interaction = {|
  id: number,
  timestamp: number,
  label: string,
|};

export type Node = {|
  actualDuration: number,
  baseDuration: number,
  displayName: string,
  id: number,
  parentID: number,
  selfDuration: number,
|};

export type CommitDetails = {|
  duration: number,
  interactions: Array<Interaction>,
  root: Node,
  timestamp: number,
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
