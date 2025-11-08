/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
import type {
  Element,
  ActivitySliceFilter,
  ComponentFilter,
} from 'react-devtools-shared/src/frontend/types';
import typeof {
  SyntheticMouseEvent,
  SyntheticKeyboardEvent,
} from 'react-dom-bindings/src/events/SyntheticEvent';

import * as React from 'react';
import {useContext, useTransition} from 'react';
import {ComponentFilterActivitySlice} from 'react-devtools-shared/src/frontend/types';
import styles from './ActivityList.css';
import {
  TreeStateContext,
  TreeDispatcherContext,
} from '../Components/TreeContext';
import {useHighlightHostInstance} from '../hooks';
import {StoreContext} from '../context';

export function useChangeActivitySliceAction(): (
  id: Element['id'] | null,
) => void {
  const store = useContext(StoreContext);

  function changeActivitySliceAction(activityID: Element['id'] | null) {
    const nextFilters: ComponentFilter[] = [];
    // Remove any existing activity slice filter
    for (let i = 0; i < store.componentFilters.length; i++) {
      const filter = store.componentFilters[i];
      if (filter.type !== ComponentFilterActivitySlice) {
        nextFilters.push(filter);
      }
    }

    if (activityID !== null) {
      const rendererID = store.getRendererIDForElement(activityID);
      if (rendererID === null) {
        throw new Error('Expected to find renderer.');
      }
      const activityFilter: ActivitySliceFilter = {
        type: ComponentFilterActivitySlice,
        activityID,
        rendererID,
        isValid: true,
        isEnabled: true,
      };
      nextFilters.push(activityFilter);
    }
    store.componentFilters = nextFilters;
  }

  return changeActivitySliceAction;
}

export default function ActivityList({
  activities,
}: {
  activities: $ReadOnlyArray<Element>,
}): React$Node {
  const {inspectedElementID} = useContext(TreeStateContext);
  const treeDispatch = useContext(TreeDispatcherContext);
  // TODO: Derive from inspected element
  const selectedActivityID = inspectedElementID;
  const {highlightHostInstance, clearHighlightHostInstance} =
    useHighlightHostInstance();

  const [isPendingActivitySliceSelection, startActivitySliceSelection] =
    useTransition();
  const changeActivitySliceAction = useChangeActivitySliceAction();

  function handleKeyDown(event: SyntheticKeyboardEvent) {
    // TODO: Implement keyboard navigation
    switch (event.key) {
      case 'Enter':
      case ' ':
        if (inspectedElementID !== null) {
          startActivitySliceSelection(() => {
            changeActivitySliceAction(inspectedElementID);
          });
        }
        event.preventDefault();
        break;
      case 'Home':
        treeDispatch({type: 'SELECT_ELEMENT_BY_ID', payload: activities[0].id});
        event.preventDefault();
        break;
      case 'End':
        treeDispatch({
          type: 'SELECT_ELEMENT_BY_ID',
          payload: activities[activities.length - 1].id,
        });
        event.preventDefault();
        break;
      case 'ArrowUp': {
        const currentIndex = activities.findIndex(
          activity => activity.id === selectedActivityID,
        );
        if (currentIndex !== undefined) {
          const nextIndex =
            (currentIndex + activities.length - 1) % activities.length;

          treeDispatch({
            type: 'SELECT_ELEMENT_BY_ID',
            payload: activities[nextIndex].id,
          });
        }
        event.preventDefault();
        break;
      }
      case 'ArrowDown': {
        const currentIndex = activities.findIndex(
          activity => activity.id === selectedActivityID,
        );
        if (currentIndex !== undefined) {
          const nextIndex = (currentIndex + 1) % activities.length;

          treeDispatch({
            type: 'SELECT_ELEMENT_BY_ID',
            payload: activities[nextIndex].id,
          });
        }
        event.preventDefault();
        break;
      }
      default:
        break;
    }
  }

  function handleClick(id: Element['id'], event: SyntheticMouseEvent) {
    event.preventDefault();
    treeDispatch({type: 'SELECT_ELEMENT_BY_ID', payload: id});
  }

  function handleDoubleClick() {
    if (inspectedElementID !== null) {
      changeActivitySliceAction(inspectedElementID);
    }
  }

  return (
    <ol
      role="listbox"
      className={styles.ActivityList}
      data-pending-activity-slice-selection={isPendingActivitySliceSelection}
      tabIndex={0}
      onKeyDown={handleKeyDown}>
      {activities.map(activity => (
        <li
          key={activity.id}
          role="option"
          aria-selected={activity.id === selectedActivityID ? 'true' : 'false'}
          className={styles.ActivityListItem}
          onClick={handleClick.bind(null, activity.id)}
          onDoubleClick={handleDoubleClick}
          onPointerOver={highlightHostInstance.bind(null, activity.id, false)}
          onPointerLeave={clearHighlightHostInstance}>
          {activity.nameProp}
        </li>
      ))}
    </ol>
  );
}
