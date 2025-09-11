/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {ReactContext} from 'shared/ReactTypes';
import type {
  Element,
  SuspenseNode,
} from 'react-devtools-shared/src/frontend/types';
import type Store from '../../store';

import * as React from 'react';
import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import {StoreContext} from '../context';

export type SuspenseTreeState = {
  lineage: $ReadOnlyArray<SuspenseNode['id']> | null,
  roots: $ReadOnlyArray<SuspenseNode['id']>,
  selectedRootID: SuspenseNode['id'] | null,
  selectedSuspenseID: SuspenseNode['id'] | null,
  timeline: $ReadOnlyArray<SuspenseNode['id']>,
  timelineIndex: number | -1,
  uniqueSuspendersOnly: boolean,
};

type ACTION_SUSPENSE_TREE_MUTATION = {
  type: 'HANDLE_SUSPENSE_TREE_MUTATION',
  payload: [Map<SuspenseNode['id'], SuspenseNode['id']>],
};
type ACTION_SET_SUSPENSE_LINEAGE = {
  type: 'SET_SUSPENSE_LINEAGE',
  payload: SuspenseNode['id'],
};
type ACTION_SELECT_SUSPENSE_BY_ID = {
  type: 'SELECT_SUSPENSE_BY_ID',
  payload: SuspenseNode['id'],
};
type ACTION_SET_SUSPENSE_TIMELINE = {
  type: 'SET_SUSPENSE_TIMELINE',
  payload: [
    $ReadOnlyArray<SuspenseNode['id']>,
    // The next Suspense ID to select in the timeline
    SuspenseNode['id'] | null,
    // Whether this timeline includes only unique suspenders
    boolean,
  ],
};
type ACTION_SUSPENSE_SET_TIMELINE_INDEX = {
  type: 'SUSPENSE_SET_TIMELINE_INDEX',
  payload: number,
};
export type SuspenseTreeAction =
  | ACTION_SUSPENSE_TREE_MUTATION
  | ACTION_SET_SUSPENSE_LINEAGE
  | ACTION_SELECT_SUSPENSE_BY_ID
  | ACTION_SET_SUSPENSE_TIMELINE
  | ACTION_SUSPENSE_SET_TIMELINE_INDEX;
export type SuspenseTreeDispatch = (action: SuspenseTreeAction) => void;

const SuspenseTreeStateContext: ReactContext<SuspenseTreeState> =
  createContext<SuspenseTreeState>(((null: any): SuspenseTreeState));
SuspenseTreeStateContext.displayName = 'SuspenseTreeStateContext';

const SuspenseTreeDispatcherContext: ReactContext<SuspenseTreeDispatch> =
  createContext<SuspenseTreeDispatch>(((null: any): SuspenseTreeDispatch));
SuspenseTreeDispatcherContext.displayName = 'SuspenseTreeDispatcherContext';

type Props = {
  children: React$Node,
};

function getDefaultRootID(store: Store): Element['id'] | null {
  const designatedRootID = store.roots.find(rootID => {
    const suspense = store.getSuspenseByID(rootID);
    return (
      store.supportsTogglingSuspense(rootID) &&
      suspense !== null &&
      suspense.children.length > 1
    );
  });

  return designatedRootID === undefined ? null : designatedRootID;
}

function getInitialState(store: Store): SuspenseTreeState {
  let initialState: SuspenseTreeState;
  const uniqueSuspendersOnly = true;
  const selectedRootID = getDefaultRootID(store);
  // TODO: Default to nearest from inspected
  if (selectedRootID === null) {
    initialState = {
      selectedSuspenseID: null,
      lineage: null,
      roots: store.roots,
      selectedRootID,
      timeline: [],
      timelineIndex: -1,
      uniqueSuspendersOnly,
    };
  } else {
    const timeline = store.getSuspendableDocumentOrderSuspense(
      selectedRootID,
      uniqueSuspendersOnly,
    );
    const timelineIndex = timeline.length - 1;
    const selectedSuspenseID =
      timelineIndex === -1 ? null : timeline[timelineIndex];
    const lineage =
      selectedSuspenseID !== null
        ? store.getSuspenseLineage(selectedSuspenseID)
        : [];
    initialState = {
      selectedSuspenseID,
      lineage,
      roots: store.roots,
      selectedRootID,
      timeline,
      timelineIndex,
      uniqueSuspendersOnly,
    };
  }

  return initialState;
}

function SuspenseTreeContextController({children}: Props): React.Node {
  const store = useContext(StoreContext);
  // This reducer is created inline because it needs access to the Store.
  // The store is mutable, but the Store itself is global and lives for the lifetime of the DevTools,
  // so it's okay for the reducer to have an empty dependencies array.
  const reducer = useMemo(
    () =>
      (
        state: SuspenseTreeState,
        action: SuspenseTreeAction,
      ): SuspenseTreeState => {
        switch (action.type) {
          case 'HANDLE_SUSPENSE_TREE_MUTATION': {
            let {selectedSuspenseID} = state;
            // If the currently-selected Element has been removed from the tree, update selection state.
            const removedIDs = action.payload[0];
            // Find the closest parent that wasn't removed during this batch.
            // We deduce the parent-child mapping from removedIDs (id -> parentID)
            // because by now it's too late to read them from the store.

            while (
              selectedSuspenseID !== null &&
              removedIDs.has(selectedSuspenseID)
            ) {
              // $FlowExpectedError[incompatible-type]
              selectedSuspenseID = removedIDs.get(selectedSuspenseID);
            }
            if (selectedSuspenseID === 0) {
              // The whole root was removed.
              selectedSuspenseID = null;
            }

            let selectedTimelineID =
              state.timeline === null
                ? null
                : state.timeline[state.timelineIndex];
            while (
              selectedTimelineID !== null &&
              removedIDs.has(selectedTimelineID)
            ) {
              // $FlowExpectedError[incompatible-type]
              selectedTimelineID = removedIDs.get(selectedTimelineID);
            }

            let nextRootID = state.selectedRootID;
            if (selectedTimelineID !== null && selectedTimelineID !== 0) {
              nextRootID =
                store.getSuspenseRootIDForSuspense(selectedTimelineID);
            }
            if (nextRootID === null) {
              nextRootID = getDefaultRootID(store);
            }

            const nextTimeline =
              nextRootID === null
                ? []
                : // TODO: Handle different timeline modes (e.g. random order)
                  store.getSuspendableDocumentOrderSuspense(
                    nextRootID,
                    state.uniqueSuspendersOnly,
                  );

            let nextTimelineIndex =
              selectedTimelineID === null || nextTimeline.length === 0
                ? -1
                : nextTimeline.indexOf(selectedTimelineID);
            if (nextTimeline.length > 0 && nextTimelineIndex === -1) {
              nextTimelineIndex = nextTimeline.length - 1;
              selectedSuspenseID = nextTimeline[nextTimelineIndex];
            }

            if (selectedSuspenseID === null && nextTimeline.length > 0) {
              selectedSuspenseID = nextTimeline[nextTimeline.length - 1];
            }

            const nextLineage =
              selectedSuspenseID !== null &&
              state.selectedSuspenseID !== selectedSuspenseID
                ? store.getSuspenseLineage(selectedSuspenseID)
                : state.lineage;

            return {
              ...state,
              lineage: nextLineage,
              roots: store.roots,
              selectedRootID: nextRootID,
              selectedSuspenseID,
              timeline: nextTimeline,
              timelineIndex: nextTimelineIndex,
            };
          }
          case 'SELECT_SUSPENSE_BY_ID': {
            const selectedSuspenseID = action.payload;
            const selectedRootID =
              store.getSuspenseRootIDForSuspense(selectedSuspenseID);

            return {
              ...state,
              selectedSuspenseID,
              selectedRootID,
            };
          }
          case 'SET_SUSPENSE_LINEAGE': {
            const suspenseID = action.payload;
            const lineage = store.getSuspenseLineage(suspenseID);
            const selectedRootID =
              store.getSuspenseRootIDForSuspense(suspenseID);

            return {
              ...state,
              lineage,
              selectedSuspenseID: suspenseID,
              selectedRootID,
            };
          }
          case 'SET_SUSPENSE_TIMELINE': {
            const previousMilestoneIndex = state.timelineIndex;
            const previousTimeline = state.timeline;
            const nextTimeline = action.payload[0];
            const nextRootID: SuspenseNode['id'] | null = action.payload[1];
            const nextUniqueSuspendersOnly = action.payload[2];
            let nextLineage = state.lineage;
            let nextMilestoneIndex: number | -1 = -1;
            let nextSelectedSuspenseID = state.selectedSuspenseID;
            // Action has indicated it has no preference for the selected Node.
            // Try to reconcile the new timeline with the previous index.
            if (
              nextRootID === null &&
              previousTimeline !== null &&
              previousMilestoneIndex !== null
            ) {
              const previousMilestoneID =
                previousTimeline[previousMilestoneIndex];
              nextMilestoneIndex = nextTimeline.indexOf(previousMilestoneID);
              if (nextMilestoneIndex === -1 && nextTimeline.length > 0) {
                nextMilestoneIndex = nextTimeline.length - 1;
                nextSelectedSuspenseID = nextTimeline[nextMilestoneIndex];
                nextLineage = store.getSuspenseLineage(nextSelectedSuspenseID);
              }
            } else if (nextRootID !== null) {
              nextMilestoneIndex = nextTimeline.length - 1;
              nextSelectedSuspenseID = nextTimeline[nextMilestoneIndex];
              nextLineage = store.getSuspenseLineage(nextSelectedSuspenseID);
            }

            return {
              ...state,
              selectedSuspenseID: nextSelectedSuspenseID,
              lineage: nextLineage,
              selectedRootID:
                nextRootID === null ? state.selectedRootID : nextRootID,
              timeline: nextTimeline,
              timelineIndex: nextMilestoneIndex,
              uniqueSuspendersOnly: nextUniqueSuspendersOnly,
            };
          }
          case 'SUSPENSE_SET_TIMELINE_INDEX': {
            const nextTimelineIndex = action.payload;
            const nextSelectedSuspenseID = state.timeline[nextTimelineIndex];
            const nextLineage = store.getSuspenseLineage(
              nextSelectedSuspenseID,
            );

            return {
              ...state,
              lineage: nextLineage,
              selectedSuspenseID: nextSelectedSuspenseID,
              timelineIndex: nextTimelineIndex,
            };
          }
          default:
            throw new Error(`Unrecognized action "${action.type}"`);
        }
      },
    [],
  );

  const [state, dispatch] = useReducer(reducer, store, getInitialState);

  const initialRevision = useMemo(() => store.revisionSuspense, [store]);
  // We're currently storing everything Suspense related in the same Store as
  // Components. However, most reads are currently stateless. This ensures
  // the latest state is always read from the Store.
  useEffect(() => {
    const handleSuspenseTreeMutated = ([removedElementIDs]: [
      Map<number, number>,
    ]) => {
      dispatch({
        type: 'HANDLE_SUSPENSE_TREE_MUTATION',
        payload: [removedElementIDs],
      });
    };

    // Since this is a passive effect, the tree may have been mutated before our initial subscription.
    if (store.revisionSuspense !== initialRevision) {
      // At the moment, we can treat this as a mutation.
      handleSuspenseTreeMutated([new Map()]);
    }

    store.addListener('suspenseTreeMutated', handleSuspenseTreeMutated);
    return () =>
      store.removeListener('suspenseTreeMutated', handleSuspenseTreeMutated);
  }, [initialRevision, store]);

  const transitionDispatch = useMemo(
    () => (action: SuspenseTreeAction) =>
      startTransition(() => {
        dispatch(action);
      }),
    [dispatch],
  );

  return (
    <SuspenseTreeStateContext.Provider value={state}>
      <SuspenseTreeDispatcherContext.Provider value={transitionDispatch}>
        {children}
      </SuspenseTreeDispatcherContext.Provider>
    </SuspenseTreeStateContext.Provider>
  );
}

export {
  SuspenseTreeDispatcherContext,
  SuspenseTreeStateContext,
  SuspenseTreeContextController,
};
