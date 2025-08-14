/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useEffect, useLayoutEffect, useReducer, useRef} from 'react';

import {
  localStorageGetItem,
  localStorageSetItem,
} from 'react-devtools-shared/src/storage';
import ButtonIcon, {type IconType} from '../ButtonIcon';
import InspectedElementErrorBoundary from '../Components/InspectedElementErrorBoundary';
import InspectedElement from '../Components/InspectedElement';
import portaledContent from '../portaledContent';
import styles from './SuspenseTab.css';
import SuspenseRects from './SuspenseRects';
import SuspenseTreeList from './SuspenseTreeList';
import Button from '../Button';

type Orientation = 'horizontal' | 'vertical';

type LayoutActionType =
  | 'ACTION_SET_TREE_LIST_TOGGLE'
  | 'ACTION_SET_TREE_LIST_HORIZONTAL_FRACTION'
  | 'ACTION_SET_INSPECTED_ELEMENT_TOGGLE'
  | 'ACTION_SET_INSPECTED_ELEMENT_HORIZONTAL_FRACTION'
  | 'ACTION_SET_INSPECTED_ELEMENT_VERTICAL_FRACTION';
type LayoutAction = {
  type: LayoutActionType,
  payload: any,
};

type LayoutState = {
  treeListHidden: boolean,
  treeListHorizontalFraction: number,
  inspectedElementHidden: boolean,
  inspectedElementHorizontalFraction: number,
  inspectedElementVerticalFraction: number,
};
type LayoutDispatch = (action: LayoutAction) => void;

function SuspenseTimeline() {
  return <div className={styles.Timeline}>timeline</div>;
}

function ToggleTreeList({
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
          type: 'ACTION_SET_TREE_LIST_TOGGLE',
          payload: null,
        })
      }
      title={state.treeListHidden ? 'Show Tree List' : 'Hide Tree List'}>
      <ButtonIcon
        type={state.treeListHidden ? 'panel-left-open' : 'panel-left-close'}
      />
    </Button>
  );
}

function ToggleInspectedElement({
  dispatch,
  state,
  orientation,
}: {
  dispatch: LayoutDispatch,
  state: LayoutState,
  orientation: 'horizontal' | 'vertical',
}) {
  let iconType: IconType;
  if (orientation === 'horizontal') {
    iconType = state.inspectedElementHidden
      ? 'panel-right-open'
      : 'panel-right-close';
  } else {
    iconType = state.inspectedElementHidden
      ? 'panel-bottom-open'
      : 'panel-bottom-close';
  }
  return (
    <Button
      className={styles.ToggleInspectedElement}
      data-orientation={orientation}
      onClick={() =>
        dispatch({
          type: 'ACTION_SET_INSPECTED_ELEMENT_TOGGLE',
          payload: null,
        })
      }
      title={
        state.inspectedElementHidden
          ? 'Show Inspected Element'
          : 'Hide Inspected Element'
      }>
      <ButtonIcon type={iconType} />
    </Button>
  );
}

function SuspenseTab(_: {}) {
  const [state, dispatch] = useReducer<LayoutState, null, LayoutAction>(
    layoutReducer,
    null,
    initLayoutState,
  );

  const wrapperTreeRef = useRef<null | HTMLElement>(null);
  const resizeTreeRef = useRef<null | HTMLElement>(null);
  const resizeTreeListRef = useRef<null | HTMLElement>(null);

  // TODO: We'll show the recently inspected element in this tab when it should probably
  // switch to the nearest Suspense boundary when we switch into this tab.

  const {
    inspectedElementHidden,
    inspectedElementHorizontalFraction,
    inspectedElementVerticalFraction,
    treeListHidden,
    treeListHorizontalFraction,
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

    const resizeTreeListElement = resizeTreeListRef.current;
    setResizeCSSVariable(
      resizeTreeListElement,
      'tree-list',
      'horizontal',
      treeListHorizontalFraction * 100,
    );
  }, []);
  useEffect(() => {
    const timeoutID = setTimeout(() => {
      localStorageSetItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          inspectedElementHidden,
          inspectedElementHorizontalFraction,
          inspectedElementVerticalFraction,
          treeListHidden,
          treeListHorizontalFraction,
        }),
      );
    }, 500);

    return () => clearTimeout(timeoutID);
  }, [
    inspectedElementHidden,
    inspectedElementHorizontalFraction,
    inspectedElementVerticalFraction,
    treeListHidden,
    treeListHorizontalFraction,
  ]);

  const onResizeStart = (event: SyntheticPointerEvent<HTMLElement>) => {
    const element = event.currentTarget;
    element.setPointerCapture(event.pointerId);
  };

  const onResizeEnd = (event: SyntheticPointerEvent<HTMLElement>) => {
    const element = event.currentTarget;
    element.releasePointerCapture(event.pointerId);
  };

  const onResizeTree = (event: SyntheticPointerEvent<HTMLElement>) => {
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

  const onResizeTreeList = (event: SyntheticPointerEvent<HTMLElement>) => {
    const element = event.currentTarget;
    const isResizing = element.hasPointerCapture(event.pointerId);
    if (!isResizing) {
      return;
    }

    const resizeElement = resizeTreeListRef.current;
    const wrapperElement = resizeTreeRef.current;

    if (wrapperElement === null || resizeElement === null) {
      return;
    }

    event.preventDefault();

    const orientation = 'horizontal';

    const {height, width, left, top} = wrapperElement.getBoundingClientRect();

    const currentMousePosition =
      orientation === 'horizontal' ? event.clientX - left : event.clientY - top;

    const boundaryMin = MINIMUM_TREE_LIST_SIZE;
    const boundaryMax =
      orientation === 'horizontal'
        ? width - MINIMUM_TREE_LIST_SIZE
        : height - MINIMUM_TREE_LIST_SIZE;

    const isMousePositionInBounds =
      currentMousePosition > boundaryMin && currentMousePosition < boundaryMax;

    if (isMousePositionInBounds) {
      const resizedElementDimension =
        orientation === 'horizontal' ? width : height;
      const actionType = 'ACTION_SET_TREE_LIST_HORIZONTAL_FRACTION';
      const percentage = (currentMousePosition / resizedElementDimension) * 100;

      setResizeCSSVariable(resizeElement, 'tree-list', orientation, percentage);

      dispatch({
        type: actionType,
        payload: currentMousePosition / resizedElementDimension,
      });
    }
  };

  return (
    <div className={styles.SuspenseTab} ref={wrapperTreeRef}>
      <div className={styles.TreeWrapper} ref={resizeTreeRef}>
        <div
          className={styles.TreeList}
          hidden={treeListHidden}
          ref={resizeTreeListRef}>
          <SuspenseTreeList />
        </div>
        <div className={styles.ResizeBarWrapper}>
          <div
            onPointerDown={onResizeStart}
            onPointerMove={onResizeTreeList}
            onPointerUp={onResizeEnd}
            className={styles.ResizeBar}
          />
        </div>
        <div className={styles.TreeView}>
          <div className={styles.TimelineWrapper}>
            <ToggleTreeList dispatch={dispatch} state={state} />
            <SuspenseTimeline />
            <ToggleInspectedElement
              dispatch={dispatch}
              state={state}
              orientation="horizontal"
            />
          </div>
          <div className={styles.Rects}>
            <SuspenseRects />
          </div>
          <footer>
            <ToggleInspectedElement
              dispatch={dispatch}
              state={state}
              orientation="vertical"
            />
          </footer>
        </div>
      </div>
      <div className={styles.ResizeBarWrapper}>
        <div
          onPointerDown={onResizeStart}
          onPointerMove={onResizeTree}
          onPointerUp={onResizeEnd}
          className={styles.ResizeBar}
        />
      </div>
      <div
        className={styles.InspectedElementWrapper}
        hidden={inspectedElementHidden}>
        <InspectedElementErrorBoundary>
          <InspectedElement />
        </InspectedElementErrorBoundary>
      </div>
    </div>
  );
}

const LOCAL_STORAGE_KEY = 'React::DevTools::SuspenseTab::layout';
const VERTICAL_TREE_MODE_MAX_WIDTH = 600;
const MINIMUM_TREE_SIZE = 100;
const MINIMUM_TREE_LIST_SIZE = 100;

function layoutReducer(state: LayoutState, action: LayoutAction): LayoutState {
  switch (action.type) {
    case 'ACTION_SET_TREE_LIST_TOGGLE':
      return {
        ...state,
        treeListHidden: !state.treeListHidden,
      };
    case 'ACTION_SET_TREE_LIST_HORIZONTAL_FRACTION':
      return {
        ...state,
        treeListHorizontalFraction: action.payload,
      };
    case 'ACTION_SET_INSPECTED_ELEMENT_TOGGLE':
      return {
        ...state,
        inspectedElementHidden: !state.inspectedElementHidden,
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
  let inspectedElementHidden = false;
  let inspectedElementHorizontalFraction = 0.65;
  let inspectedElementVerticalFraction = 0.5;
  let treeListHidden = false;
  let treeListHorizontalFraction = 0.35;

  try {
    let data = localStorageGetItem(LOCAL_STORAGE_KEY);
    if (data != null) {
      data = JSON.parse(data);
      inspectedElementHidden = data.inspectedElementHidden;
      inspectedElementHorizontalFraction =
        data.inspectedElementHorizontalFraction;
      inspectedElementVerticalFraction = data.inspectedElementVerticalFraction;
      treeListHidden = data.treeListHidden;
      treeListHorizontalFraction = data.treeListHorizontalFraction;
    }
  } catch (error) {}

  return {
    inspectedElementHidden,
    inspectedElementHorizontalFraction,
    inspectedElementVerticalFraction,
    treeListHidden,
    treeListHorizontalFraction,
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
  name: 'tree' | 'tree-list',
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

export default (portaledContent(SuspenseTab): React$ComponentType<{}>);
