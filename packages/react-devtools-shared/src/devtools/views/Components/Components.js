/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {
  useContext,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
} from 'react';
import Tree from './Tree';
import {OwnersListContextController} from './OwnersListContext';
import portaledContent from '../portaledContent';
import {SettingsModalContextController} from 'react-devtools-shared/src/devtools/views/Settings/SettingsModalContext';
import {
  localStorageGetItem,
  localStorageSetItem,
} from 'react-devtools-shared/src/storage';
import InspectedElementErrorBoundary from './InspectedElementErrorBoundary';
import InspectedElement from './InspectedElement';
import {TreeStateContext} from './TreeContext';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import {ModalDialog} from '../ModalDialog';
import ActivityList from '../SuspenseTab/ActivityList';
import SettingsModal from 'react-devtools-shared/src/devtools/views/Settings/SettingsModal';
import {NativeStyleContextController} from './NativeStyleEditor/context';

import styles from './Components.css';
import typeof {SyntheticPointerEvent} from 'react-dom-bindings/src/events/SyntheticEvent';

type Orientation = 'horizontal' | 'vertical';

type LayoutActionType =
  | 'ACTION_SET_ACTIVITY_LIST_TOGGLE'
  | 'ACTION_SET_ACTIVITY_LIST_HORIZONTAL_FRACTION'
  | 'ACTION_SET_INSPECTED_ELEMENT_HORIZONTAL_FRACTION'
  | 'ACTION_SET_INSPECTED_ELEMENT_VERTICAL_FRACTION';
type LayoutAction = {
  type: LayoutActionType,
  payload: any,
};

type LayoutState = {
  activityListHidden: boolean,
  activityListHorizontalFraction: number,
  inspectedElementHorizontalFraction: number,
  inspectedElementVerticalFraction: number,
};
type LayoutDispatch = (action: LayoutAction) => void;

function ToggleActivityList({
  dispatch,
  state,
}: {
  dispatch: LayoutDispatch,
  state: LayoutState,
}) {
  return (
    <Button
      onClick={() =>
        dispatch({
          type: 'ACTION_SET_ACTIVITY_LIST_TOGGLE',
          payload: null,
        })
      }
      title={
        state.activityListHidden ? 'Show Activity List' : 'Hide Activity List'
      }>
      <ButtonIcon
        type={state.activityListHidden ? 'panel-left-open' : 'panel-left-close'}
      />
    </Button>
  );
}

function Components(_: {}) {
  const [state, dispatch] = useReducer<LayoutState, null, LayoutAction>(
    layoutReducer,
    null,
    initLayoutState,
  );

  const {activities} = useContext(TreeStateContext);
  // If there are no named Activity boundaries, we don't have any tree list and we should hide
  // both the panel and the button to toggle it.
  const activityListDisabled = activities.length === 0;

  const wrapperTreeRef = useRef<null | HTMLElement>(null);
  const resizeTreeRef = useRef<null | HTMLElement>(null);
  const resizeActivityListRef = useRef<null | HTMLElement>(null);

  const {
    inspectedElementHorizontalFraction,
    inspectedElementVerticalFraction,
    activityListHidden,
    activityListHorizontalFraction,
  } = state;

  useLayoutEffect(() => {
    const wrapperElement = wrapperTreeRef.current;

    setResizeCSSVariable(
      wrapperElement,
      'tree',
      'horizontal',
      inspectedElementHorizontalFraction * 100,
    );
    setResizeCSSVariable(
      wrapperElement,
      'tree',
      'vertical',
      inspectedElementVerticalFraction * 100,
    );

    const resizeActivityListElement = resizeActivityListRef.current;
    setResizeCSSVariable(
      resizeActivityListElement,
      'activity-list',
      'horizontal',
      activityListHorizontalFraction * 100,
    );
  }, []);
  useEffect(() => {
    const timeoutID = setTimeout(() => {
      localStorageSetItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          inspectedElementHorizontalFraction,
          inspectedElementVerticalFraction,
          activityListHidden,
          activityListHorizontalFraction,
        }),
      );
    }, 500);

    return () => clearTimeout(timeoutID);
  }, [
    inspectedElementHorizontalFraction,
    inspectedElementVerticalFraction,
    activityListHidden,
    activityListHorizontalFraction,
  ]);

  const onResizeStart = (event: SyntheticPointerEvent) => {
    const element = event.currentTarget;
    element.setPointerCapture(event.pointerId);
  };

  const onResizeEnd = (event: SyntheticPointerEvent) => {
    const element = event.currentTarget;
    element.releasePointerCapture(event.pointerId);
  };

  const onResizeTree = (event: SyntheticPointerEvent) => {
    const element = event.currentTarget;
    const isResizing = element.hasPointerCapture(event.pointerId);
    if (!isResizing) {
      return;
    }

    const resizeElement = resizeTreeRef.current;
    const wrapperElement = wrapperTreeRef.current;

    if (wrapperElement === null || resizeElement === null) {
      return;
    }

    event.preventDefault();

    const orientation = getTreeOrientation(wrapperElement);

    const {height, width, left, top} = wrapperElement.getBoundingClientRect();

    const currentMousePosition =
      orientation === 'horizontal' ? event.clientX - left : event.clientY - top;

    const boundaryMin = MINIMUM_TREE_SIZE;
    const boundaryMax =
      orientation === 'horizontal'
        ? width - MINIMUM_TREE_SIZE
        : height - MINIMUM_TREE_SIZE;

    const isMousePositionInBounds =
      currentMousePosition > boundaryMin && currentMousePosition < boundaryMax;

    if (isMousePositionInBounds) {
      const resizedElementDimension =
        orientation === 'horizontal' ? width : height;
      const actionType =
        orientation === 'horizontal'
          ? 'ACTION_SET_INSPECTED_ELEMENT_HORIZONTAL_FRACTION'
          : 'ACTION_SET_INSPECTED_ELEMENT_VERTICAL_FRACTION';
      const fraction = currentMousePosition / resizedElementDimension;
      const percentage = fraction * 100;

      setResizeCSSVariable(wrapperElement, 'tree', orientation, percentage);

      dispatch({
        type: actionType,
        payload: fraction,
      });
    }
  };

  const onResizeActivityList = (event: SyntheticPointerEvent) => {
    const element = event.currentTarget;
    const isResizing = element.hasPointerCapture(event.pointerId);
    if (!isResizing) {
      return;
    }

    const resizeElement = resizeActivityListRef.current;
    const wrapperElement = resizeTreeRef.current;

    if (wrapperElement === null || resizeElement === null) {
      return;
    }

    event.preventDefault();

    const orientation = 'horizontal';

    const {height, width, left, top} = wrapperElement.getBoundingClientRect();

    const currentMousePosition =
      orientation === 'horizontal' ? event.clientX - left : event.clientY - top;

    const boundaryMin = MINIMUM_ACTIVITY_LIST_SIZE;
    const boundaryMax =
      orientation === 'horizontal'
        ? width - MINIMUM_ACTIVITY_LIST_SIZE
        : height - MINIMUM_ACTIVITY_LIST_SIZE;

    const isMousePositionInBounds =
      currentMousePosition > boundaryMin && currentMousePosition < boundaryMax;

    if (isMousePositionInBounds) {
      const resizedElementDimension =
        orientation === 'horizontal' ? width : height;
      const actionType = 'ACTION_SET_ACTIVITY_LIST_HORIZONTAL_FRACTION';
      const percentage = (currentMousePosition / resizedElementDimension) * 100;

      setResizeCSSVariable(
        resizeElement,
        'activity-list',
        orientation,
        percentage,
      );

      dispatch({
        type: actionType,
        payload: currentMousePosition / resizedElementDimension,
      });
    }
  };

  return (
    <SettingsModalContextController>
      <OwnersListContextController>
        <div className={styles.Components} ref={wrapperTreeRef}>
          <div className={styles.TreeWrapper} ref={resizeTreeRef}>
            {activityListDisabled ? null : (
              <div
                className={styles.ActivityList}
                hidden={activityListHidden}
                ref={resizeActivityListRef}>
                <ActivityList activities={activities} />
              </div>
            )}
            {activityListDisabled ? null : (
              <div
                className={styles.ResizeBarWrapper}
                hidden={activityListHidden}>
                <div
                  onPointerDown={onResizeStart}
                  onPointerMove={onResizeActivityList}
                  onPointerUp={onResizeEnd}
                  className={styles.ResizeBar}
                />
              </div>
            )}
            <Tree
              toggleActivityList={
                activityListDisabled ? null : (
                  <ToggleActivityList dispatch={dispatch} state={state} />
                )
              }
            />
          </div>
          <div className={styles.ResizeBarWrapper}>
            <div
              onPointerDown={onResizeStart}
              onPointerMove={onResizeTree}
              onPointerUp={onResizeEnd}
              className={styles.ResizeBar}
            />
          </div>
          <div className={styles.InspectedElementWrapper}>
            <NativeStyleContextController>
              <InspectedElementErrorBoundary>
                <InspectedElement />
              </InspectedElementErrorBoundary>
            </NativeStyleContextController>
          </div>
          <ModalDialog />
          <SettingsModal />
        </div>
      </OwnersListContextController>
    </SettingsModalContextController>
  );
}

const LOCAL_STORAGE_KEY = 'React::DevTools::createResizeReducer';
const VERTICAL_TREE_MODE_MAX_WIDTH = 600;
const MINIMUM_TREE_SIZE = 100;
const MINIMUM_ACTIVITY_LIST_SIZE = 100;

function layoutReducer(state: LayoutState, action: LayoutAction): LayoutState {
  switch (action.type) {
    case 'ACTION_SET_ACTIVITY_LIST_TOGGLE':
      return {
        ...state,
        activityListHidden: !state.activityListHidden,
      };
    case 'ACTION_SET_ACTIVITY_LIST_HORIZONTAL_FRACTION':
      return {
        ...state,
        activityListHorizontalFraction: action.payload,
      };
    case 'ACTION_SET_INSPECTED_ELEMENT_HORIZONTAL_FRACTION':
      return {
        ...state,
        inspectedElementHorizontalFraction: action.payload,
      };
    case 'ACTION_SET_INSPECTED_ELEMENT_VERTICAL_FRACTION':
      return {
        ...state,
        inspectedElementVerticalFraction: action.payload,
      };
    default:
      return state;
  }
}

function initLayoutState(): LayoutState {
  let inspectedElementHorizontalFraction = 0.65;
  let inspectedElementVerticalFraction = 0.5;
  let activityListHidden = false;
  let activityListHorizontalFraction = 0.35;

  try {
    let data = localStorageGetItem(LOCAL_STORAGE_KEY);
    if (data != null) {
      data = JSON.parse(data);
      inspectedElementHorizontalFraction =
        data.inspectedElementHorizontalFraction;
      inspectedElementVerticalFraction = data.inspectedElementVerticalFraction;
      activityListHidden = data.activityListHidden;
      activityListHorizontalFraction = data.activityListHorizontalFraction;
    }
  } catch (error) {}

  return {
    inspectedElementHorizontalFraction,
    inspectedElementVerticalFraction,
    activityListHidden,
    activityListHorizontalFraction,
  };
}

function getTreeOrientation(
  wrapperElement: null | HTMLElement,
): null | Orientation {
  if (wrapperElement != null) {
    const {width} = wrapperElement.getBoundingClientRect();
    return width > VERTICAL_TREE_MODE_MAX_WIDTH ? 'horizontal' : 'vertical';
  }
  return null;
}

function setResizeCSSVariable(
  resizeElement: null | HTMLElement,
  name: 'tree' | 'activity-list',
  orientation: null | Orientation,
  percentage: number,
): void {
  if (resizeElement !== null && orientation !== null) {
    resizeElement.style.setProperty(
      `--${orientation}-resize-${name}-percentage`,
      `${percentage}%`,
    );
  }
}

export default (portaledContent(Components): component());
