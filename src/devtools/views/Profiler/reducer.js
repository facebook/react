// @flow

import Store from '../../store';

type Node = {|
  id: number,
  children: Array<number>,
  displayName: string | null,
  key: number | string | null,
|};

export type State = {|
  hasProfilingData: boolean,
  isProfiling: boolean,

  // List of tree mutation that occur during profiling.
  // Once profiling is finished, these mutations can be used, along with the initial tree snapshots,
  // to reconstruct the state of each root for each commit.
  _operations: Array<Uint32Array>,

  // Snapshot of the state of the main Store (including all roots) when profiling started.
  // Once profiling is finished, this snapshot can be used along with "operations" messages emitted during profiling,
  // to reconstruct the state of each root for each commit.
  // It's okay to use a single root to store this information because node IDs are unique across all roots.
  _snapshot: Map<number, Node>,
|};

export type HANDLE_OPERATIONS_ACTION = {|
  type: 'HANDLE_OPERATIONS',
  payload: Uint32Array,
|};

export type HANDLE_PROFILING_STATUS_CHANGE_ACTION = {|
  type: 'HANDLE_PROFILING_STATUS_CHANGE',
  payload: {
    isProfiling: boolean,
    store: Store,
  },
|};

export type SEND_START_PROFILING_ACTION = {|
  type: 'SEND_START_PROFILING',
|};

export type SEND_STOP_PROFILING_ACTION = {|
  type: 'SEND_STOP_PROFILING',
|};

type Action =
  | HANDLE_OPERATIONS_ACTION
  | HANDLE_PROFILING_STATUS_CHANGE_ACTION
  | SEND_START_PROFILING_ACTION
  | SEND_STOP_PROFILING_ACTION;

// TODO (profiling) Lift this state up so it's shared between tabs.

export default function reducer(state: State, action: Action): State {
  const { type } = action;
  switch (type) {
    case 'HANDLE_OPERATIONS':
      if (state.isProfiling) {
        const operations = ((action: any): HANDLE_OPERATIONS_ACTION).payload;
        return {
          ...state,
          hasProfilingData: true,
          _operations: state._operations.concat(operations),
        };
      } else {
        return state;
      }
    case 'HANDLE_PROFILING_STATUS_CHANGE':
      const {
        isProfiling,
        store,
      } = ((action: any): HANDLE_PROFILING_STATUS_CHANGE_ACTION).payload;

      if (isProfiling) {
        const snapshot = new Map();

        const recursiveSnapshot = id => {
          const element = store.getElementByID(id);
          if (element !== null) {
            snapshot.set(id, {
              id,
              children: element.children.slice(0),
              displayName: element.displayName,
              key: element.key,
            });
            element.children.forEach(id => recursiveSnapshot(id));
          }
        };

        store.roots.forEach(rootID => recursiveSnapshot(rootID));

        return {
          ...state,
          isProfiling,
          _operations: [],
          _snapshot: snapshot,
        };
      } else {
        return {
          ...state,
          isProfiling,
        };
      }
    case 'SEND_START_PROFILING':
      return { ...state, hasProfilingData: false, isProfiling: true };
    case 'SEND_STOP_PROFILING':
      return { ...state, isProfiling: false };
    default:
      throw new Error(`Unrecognized action "${type}"`);
  }
}
