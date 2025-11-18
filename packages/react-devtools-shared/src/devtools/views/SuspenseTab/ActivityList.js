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
import type Store from 'react-devtools-shared/src/devtools/store';

import * as React from 'react';
import {useContext, useMemo, useTransition} from 'react';
import {
  ComponentFilterActivitySlice,
  ElementTypeActivity,
} from 'react-devtools-shared/src/frontend/types';
import styles from './ActivityList.css';
import {
  TreeStateContext,
  TreeDispatcherContext,
} from '../Components/TreeContext';
import {useHighlightHostInstance} from '../hooks';
import {StoreContext} from '../context';
import ButtonIcon from '../ButtonIcon';
import Button from '../Button';

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

function findNearestActivityParentID(
  elementID: Element['id'],
  store: Store,
): Element['id'] | null {
  let currentID: null | Element['id'] = elementID;
  while (currentID !== null) {
    const element = store.getElementByID(currentID);
    if (element === null) {
      return null;
    }
    if (element.type === ElementTypeActivity) {
      return element.id;
    }
    currentID = element.parentID;
  }

  return currentID;
}

function useSelectedActivityID(): Element['id'] | null {
  const {inspectedElementID} = useContext(TreeStateContext);
  const store = useContext(StoreContext);
  return useMemo(() => {
    if (inspectedElementID === null) {
      return null;
    }
    const nearestActivityID = findNearestActivityParentID(
      inspectedElementID,
      store,
    );
    return nearestActivityID;
  }, [inspectedElementID, store]);
}

export default function ActivityList({
  activities,
}: {
  activities: $ReadOnlyArray<{id: Element['id'], depth: number}>,
}): React$Node {
  const {activityID, inspectedElementID} = useContext(TreeStateContext);
  const treeDispatch = useContext(TreeDispatcherContext);
  const store = useContext(StoreContext);
  const selectedActivityID = useSelectedActivityID();
  const {highlightHostInstance, clearHighlightHostInstance} =
    useHighlightHostInstance();

  const [isPendingActivitySliceSelection, startActivitySliceSelection] =
    useTransition();
  const changeActivitySliceAction = useChangeActivitySliceAction();

  function handleKeyDown(event: SyntheticKeyboardEvent) {
    switch (event.key) {
      case 'Escape':
        startActivitySliceSelection(() => {
          changeActivitySliceAction(null);
        });
        event.preventDefault();
        break;
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
    <div className={styles.ActivityListContaier}>
      <div className={styles.ActivityListHeader}>
        {activityID !== null && (
          // TODO: Obsolete once filtered Activities are included in this list.
          <Button
            onClick={startActivitySliceSelection.bind(
              null,
              changeActivitySliceAction.bind(null, null),
            )}
            title="Back to full tree view">
            <ButtonIcon type="previous" />
          </Button>
        )}
      </div>
      <ol
        role="listbox"
        className={styles.ActivityListList}
        data-pending-activity-slice-selection={isPendingActivitySliceSelection}
        tabIndex={0}
        onKeyDown={handleKeyDown}>
        {activities.map(({id, depth}) => {
          const activity = store.getElementByID(id);
          if (activity === null) {
            return null;
          }
          const name = activity.nameProp;
          if (name === null) {
            // This shouldn't actually happen. We only want to show activities with a name.
            // And hide the whole list if no named Activities are present.
            return null;
          }

          // TODO: Filtered Activities should have dedicated styles once we include
          // filtered Activities in this list.
          return (
            <li
              key={activity.id}
              role="option"
              aria-selected={
                activity.id === selectedActivityID ? 'true' : 'false'
              }
              className={styles.ActivityListItem}
              onClick={handleClick.bind(null, activity.id)}
              onDoubleClick={handleDoubleClick}
              onPointerOver={highlightHostInstance.bind(
                null,
                activity.id,
                false,
              )}
              onPointerLeave={clearHighlightHostInstance}>
              {'\u00A0'.repeat(depth) + name}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
