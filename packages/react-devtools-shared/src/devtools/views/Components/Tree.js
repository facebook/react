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
  Fragment,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {FixedSizeList} from 'react-window';
import {TreeDispatcherContext, TreeStateContext} from './TreeContext';
import Icon from '../Icon';
import {SettingsContext} from '../Settings/SettingsContext';
import {BridgeContext, StoreContext, OptionsContext} from '../context';
import Element from './Element';
import InspectHostNodesToggle from './InspectHostNodesToggle';
import OwnersStack from './OwnersStack';
import ComponentSearchInput from './ComponentSearchInput';
import SettingsModalContextToggle from 'react-devtools-shared/src/devtools/views/Settings/SettingsModalContextToggle';
import SelectedTreeHighlight from './SelectedTreeHighlight';
import TreeFocusedContext from './TreeFocusedContext';
import {useHighlightHostInstance, useSubscription} from '../hooks';
import {clearErrorsAndWarnings as clearErrorsAndWarningsAPI} from 'react-devtools-shared/src/backendAPI';
import styles from './Tree.css';
import ButtonIcon from '../ButtonIcon';
import Button from '../Button';
import {logEvent} from 'react-devtools-shared/src/Logger';
import {useExtensionComponentsPanelVisibility} from 'react-devtools-shared/src/frontend/hooks/useExtensionComponentsPanelVisibility';
import {useChangeOwnerAction} from './OwnersListContext';

// Never indent more than this number of pixels (even if we have the room).
const DEFAULT_INDENTATION_SIZE = 12;

export type ItemData = {
  isNavigatingWithKeyboard: boolean,
  onElementMouseEnter: (id: number) => void,
  treeFocused: boolean,
};

function calculateInitialScrollOffset(
  inspectedElementIndex: number | null,
  elementHeight: number,
): number | void {
  if (inspectedElementIndex === null) {
    return undefined;
  }

  if (inspectedElementIndex < 3) {
    return undefined;
  }

  // Make 3 elements on top of the inspected one visible
  return (inspectedElementIndex - 3) * elementHeight;
}

export default function Tree(): React.Node {
  const dispatch = useContext(TreeDispatcherContext);
  const {
    numElements,
    ownerID,
    searchIndex,
    searchResults,
    inspectedElementID,
    inspectedElementIndex,
  } = useContext(TreeStateContext);
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);
  const {hideSettings} = useContext(OptionsContext);
  const {lineHeight} = useContext(SettingsContext);

  const [isNavigatingWithKeyboard, setIsNavigatingWithKeyboard] =
    useState(false);
  const {highlightHostInstance, clearHighlightHostInstance} =
    useHighlightHostInstance();
  const [treeFocused, setTreeFocused] = useState<boolean>(false);
  const componentsPanelVisible = useExtensionComponentsPanelVisibility(bridge);

  const treeRef = useRef<HTMLDivElement | null>(null);
  const focusTargetRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!componentsPanelVisible) {
      return;
    }

    if (listRef.current != null && inspectedElementIndex !== null) {
      listRef.current.scrollToItem(inspectedElementIndex, 'smart');
    }
  }, [inspectedElementIndex, componentsPanelVisible]);

  // Picking an element in the inspector should put focus into the tree.
  // If possible, navigation works right after picking a node.
  // NOTE: This is not guaranteed to work, because browser extension panels are hosted inside an iframe.
  useEffect(() => {
    function handleStopInspectingHost(didSelectNode: boolean) {
      if (didSelectNode && focusTargetRef.current !== null) {
        focusTargetRef.current.focus();
        logEvent({
          event_name: 'select-element',
          metadata: {source: 'inspector'},
        });
      }
    }
    bridge.addListener('stopInspectingHost', handleStopInspectingHost);
    return () =>
      bridge.removeListener('stopInspectingHost', handleStopInspectingHost);
  }, [bridge]);

  // Navigate the tree with up/down arrow keys.
  useEffect(() => {
    if (treeRef.current === null) {
      return () => {};
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event: any).target.tagName === 'INPUT' || event.defaultPrevented) {
        return;
      }

      let element;
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (event.altKey) {
            dispatch({type: 'SELECT_NEXT_SIBLING_IN_TREE'});
          } else {
            dispatch({type: 'SELECT_NEXT_ELEMENT_IN_TREE'});
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          element =
            inspectedElementID !== null
              ? store.getElementByID(inspectedElementID)
              : null;
          if (element !== null) {
            if (event.altKey) {
              if (element.ownerID !== null) {
                dispatch({type: 'SELECT_OWNER_LIST_PREVIOUS_ELEMENT_IN_TREE'});
              }
            } else {
              if (element.children.length > 0 && !element.isCollapsed) {
                store.toggleIsCollapsed(element.id, true);
              } else {
                dispatch({type: 'SELECT_PARENT_ELEMENT_IN_TREE'});
              }
            }
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          element =
            inspectedElementID !== null
              ? store.getElementByID(inspectedElementID)
              : null;
          if (element !== null) {
            if (event.altKey) {
              dispatch({type: 'SELECT_OWNER_LIST_NEXT_ELEMENT_IN_TREE'});
            } else {
              if (element.children.length > 0 && element.isCollapsed) {
                store.toggleIsCollapsed(element.id, false);
              } else {
                dispatch({type: 'SELECT_CHILD_ELEMENT_IN_TREE'});
              }
            }
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (event.altKey) {
            dispatch({type: 'SELECT_PREVIOUS_SIBLING_IN_TREE'});
          } else {
            dispatch({type: 'SELECT_PREVIOUS_ELEMENT_IN_TREE'});
          }
          break;
        default:
          return;
      }
      setIsNavigatingWithKeyboard(true);
    };

    // We used to listen to at the document level for this event.
    // That allowed us to listen to up/down arrow key events while another section
    // of DevTools (like the search input) was focused.
    // This was a minor UX positive.
    //
    // (We had to use ownerDocument rather than document for this, because the
    // DevTools extension renders the Components and Profiler tabs into portals.)
    //
    // This approach caused a problem though: it meant that a react-devtools-inline
    // instance could steal (and prevent/block) keyboard events from other JavaScript
    // on the page– which could even include other react-devtools-inline instances.
    // This is a potential major UX negative.
    //
    // Given the above trade offs, we now listen on the root of the Tree itself.
    const container = treeRef.current;
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch, inspectedElementID, store]);

  // Focus management.
  const handleBlur = useCallback(() => setTreeFocused(false), []);
  const handleFocus = useCallback(() => setTreeFocused(true), []);

  const changeOwnerAction = useChangeOwnerAction();
  const handleKeyPress = useCallback(
    (event: $FlowFixMe) => {
      switch (event.key) {
        case 'Enter':
        case ' ':
          if (inspectedElementID !== null) {
            changeOwnerAction(inspectedElementID);
          }
          break;
        default:
          break;
      }
    },
    [dispatch, inspectedElementID],
  );

  // If we switch the selected element while using the keyboard,
  // start highlighting it in the DOM instead of the last hovered node.
  const searchRef = useRef({searchIndex, searchResults});
  useEffect(() => {
    let didSelectNewSearchResult = false;
    if (
      searchRef.current.searchIndex !== searchIndex ||
      searchRef.current.searchResults !== searchResults
    ) {
      searchRef.current.searchIndex = searchIndex;
      searchRef.current.searchResults = searchResults;
      didSelectNewSearchResult = true;
    }
    if (isNavigatingWithKeyboard || didSelectNewSearchResult) {
      if (inspectedElementID !== null) {
        highlightHostInstance(inspectedElementID);
      } else {
        clearHighlightHostInstance();
      }
    }
  }, [
    bridge,
    isNavigatingWithKeyboard,
    highlightHostInstance,
    searchIndex,
    searchResults,
    inspectedElementID,
  ]);

  // Highlight last hovered element.
  const handleElementMouseEnter = useCallback(
    (id: $FlowFixMe) => {
      // Ignore hover while we're navigating with keyboard.
      // This avoids flicker from the hovered nodes under the mouse.
      if (!isNavigatingWithKeyboard) {
        highlightHostInstance(id);
      }
    },
    [isNavigatingWithKeyboard, highlightHostInstance],
  );

  const handleMouseMove = useCallback(() => {
    // We started using the mouse again.
    // This will enable hover styles in individual rows.
    setIsNavigatingWithKeyboard(false);
  }, []);

  const handleMouseLeave = clearHighlightHostInstance;

  // Let react-window know to re-render any time the underlying tree data changes.
  // This includes the owner context, since it controls a filtered view of the tree.
  const itemData = useMemo<ItemData>(
    () => ({
      isNavigatingWithKeyboard,
      onElementMouseEnter: handleElementMouseEnter,
      treeFocused,
    }),
    [isNavigatingWithKeyboard, handleElementMouseEnter, treeFocused],
  );

  const itemKey = useCallback(
    (index: number) => store.getElementIDAtIndex(index),
    [store],
  );

  const handlePreviousErrorOrWarningClick = React.useCallback(() => {
    dispatch({type: 'SELECT_PREVIOUS_ELEMENT_WITH_ERROR_OR_WARNING_IN_TREE'});
  }, []);

  const handleNextErrorOrWarningClick = React.useCallback(() => {
    dispatch({type: 'SELECT_NEXT_ELEMENT_WITH_ERROR_OR_WARNING_IN_TREE'});
  }, []);

  const errorsOrWarningsSubscription = useMemo(
    () => ({
      getCurrentValue: () => ({
        errors: store.componentWithErrorCount,
        warnings: store.componentWithWarningCount,
      }),
      subscribe: (callback: Function) => {
        store.addListener('mutated', callback);
        return () => store.removeListener('mutated', callback);
      },
    }),
    [store],
  );
  const {errors, warnings} = useSubscription(errorsOrWarningsSubscription);

  const clearErrorsAndWarnings = () => {
    clearErrorsAndWarningsAPI({bridge, store});
  };

  const zeroElementsNotice = (
    <div className={styles.ZeroElementsNotice}>
      <p>Loading React Element Tree...</p>
      <p>
        If this seems stuck, please follow the{' '}
        <a
          className={styles.Link}
          href="https://github.com/facebook/react/blob/main/packages/react-devtools/README.md#the-react-tab-shows-no-components"
          target="_blank">
          troubleshooting instructions
        </a>
        .
      </p>
    </div>
  );

  return (
    <TreeFocusedContext.Provider value={treeFocused}>
      <div className={styles.Tree} ref={treeRef}>
        <div className={styles.SearchInput}>
          {store.supportsClickToInspect && (
            <Fragment>
              <InspectHostNodesToggle />
              <div className={styles.VRule} />
            </Fragment>
          )}
          <Suspense fallback={<Loading />}>
            {ownerID !== null ? <OwnersStack /> : <ComponentSearchInput />}
          </Suspense>
          {ownerID === null && (errors > 0 || warnings > 0) && (
            <React.Fragment>
              <div className={styles.VRule} />
              {errors > 0 && (
                <div className={styles.IconAndCount}>
                  <Icon className={styles.ErrorIcon} type="error" />
                  {errors}
                </div>
              )}
              {warnings > 0 && (
                <div className={styles.IconAndCount}>
                  <Icon className={styles.WarningIcon} type="warning" />
                  {warnings}
                </div>
              )}
              <Button
                onClick={handlePreviousErrorOrWarningClick}
                title="Scroll to previous error or warning">
                <ButtonIcon type="up" />
              </Button>
              <Button
                onClick={handleNextErrorOrWarningClick}
                title="Scroll to next error or warning">
                <ButtonIcon type="down" />
              </Button>
              <Button
                onClick={clearErrorsAndWarnings}
                title="Clear all errors and warnings">
                <ButtonIcon type="clear" />
              </Button>
            </React.Fragment>
          )}
          {!hideSettings && (
            <Fragment>
              <div className={styles.VRule} />
              <SettingsModalContextToggle />
            </Fragment>
          )}
        </div>
        {numElements === 0 ? (
          zeroElementsNotice
        ) : (
          <div
            className={styles.AutoSizerWrapper}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyPress={handleKeyPress}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            ref={focusTargetRef}
            tabIndex={0}>
            <AutoSizer>
              {({height, width}) => (
                <FixedSizeList
                  className={styles.List}
                  height={height}
                  initialScrollOffset={calculateInitialScrollOffset(
                    inspectedElementIndex,
                    lineHeight,
                  )}
                  innerElementType={InnerElementType}
                  itemCount={numElements}
                  itemData={itemData}
                  itemKey={itemKey}
                  itemSize={lineHeight}
                  ref={listRef}
                  width={width}>
                  {Element}
                </FixedSizeList>
              )}
            </AutoSizer>
          </div>
        )}
      </div>
    </TreeFocusedContext.Provider>
  );
}

// Indentation size can be adjusted but child width is fixed.
// We need to adjust indentations so the widest child can fit without overflowing.
// Sometimes the widest child is also the deepest in the tree:
//   ┏----------------------┓
//   ┆ <Foo>                ┆
//   ┆ ••••<Foobar>         ┆
//   ┆ ••••••••<Baz>        ┆
//   ┗----------------------┛
//
// But this is not always the case.
// Even with the above example, a change in indentation may change the overall widest child:
//   ┏----------------------┓
//   ┆ <Foo>                ┆
//   ┆ ••<Foobar>           ┆
//   ┆ ••••<Baz>            ┆
//   ┗----------------------┛
//
// In extreme cases this difference can be important:
//   ┏----------------------┓
//   ┆ <ReallyLongName>     ┆
//   ┆ ••<Foo>              ┆
//   ┆ ••••<Bar>            ┆
//   ┆ ••••••<Baz>          ┆
//   ┆ ••••••••<Qux>        ┆
//   ┗----------------------┛
//
// In the above example, the current indentation is fine,
// but if we naively assumed that the widest element is also the deepest element,
// we would end up compressing the indentation unnecessarily:
//   ┏----------------------┓
//   ┆ <ReallyLongName>     ┆
//   ┆ •<Foo>               ┆
//   ┆ ••<Bar>              ┆
//   ┆ •••<Baz>             ┆
//   ┆ ••••<Qux>            ┆
//   ┗----------------------┛
//
// The way we deal with this is to compute the max indentation size that can fit each child,
// given the child's fixed width and depth within the tree.
// Then we take the smallest of these indentation sizes...
function updateIndentationSizeVar(
  innerDiv: HTMLDivElement,
  cachedChildWidths: WeakMap<HTMLElement, number>,
  indentationSizeRef: {current: number},
  prevListWidthRef: {current: number},
): void {
  const list = ((innerDiv.parentElement: any): HTMLDivElement);
  const listWidth = list.clientWidth;

  // Skip measurements when the Components panel is hidden.
  if (listWidth === 0) {
    return;
  }

  // Reset the max indentation size if the width of the tree has increased.
  if (listWidth > prevListWidthRef.current) {
    indentationSizeRef.current = DEFAULT_INDENTATION_SIZE;
  }
  prevListWidthRef.current = listWidth;

  let maxIndentationSize: number = indentationSizeRef.current;

  // eslint-disable-next-line no-for-of-loops/no-for-of-loops
  for (const child of innerDiv.children) {
    const depth = parseInt(child.getAttribute('data-depth'), 10) || 0;

    let childWidth: number = 0;

    const cachedChildWidth = cachedChildWidths.get(child);
    if (cachedChildWidth != null) {
      childWidth = cachedChildWidth;
    } else {
      const {firstElementChild} = child;

      // Skip over e.g. the guideline element
      if (firstElementChild != null) {
        childWidth = firstElementChild.clientWidth;
        cachedChildWidths.set(child, childWidth);
      }
    }

    const remainingWidth = Math.max(0, listWidth - childWidth);

    maxIndentationSize = Math.min(maxIndentationSize, remainingWidth / depth);
  }

  indentationSizeRef.current = maxIndentationSize;

  list.style.setProperty('--indentation-size', `${maxIndentationSize}px`);
}

// $FlowFixMe[missing-local-annot]
function InnerElementType({children, style}) {
  const {ownerID} = useContext(TreeStateContext);

  const cachedChildWidths = useMemo<WeakMap<HTMLElement, number>>(
    () => new WeakMap(),
    [],
  );

  // This ref tracks the current indentation size.
  // We decrease indentation to fit wider/deeper trees.
  // We intentionally do not increase it again afterward, to avoid the perception of content "jumping"
  // e.g. clicking to toggle/collapse a row might otherwise jump horizontally beneath your cursor,
  // e.g. scrolling a wide row off screen could cause narrower rows to jump to the right some.
  //
  // There are two exceptions for this:
  // 1. The first is when the width of the tree increases.
  // The user may have resized the window specifically to make more room for DevTools.
  // In either case, this should reset our max indentation size logic.
  // 2. The second is when the user enters or exits an owner tree.
  const indentationSizeRef = useRef<number>(DEFAULT_INDENTATION_SIZE);
  const prevListWidthRef = useRef<number>(0);
  const prevOwnerIDRef = useRef<number | null>(ownerID);
  const divRef = useRef<HTMLDivElement | null>(null);

  // We shouldn't retain this width across different conceptual trees though,
  // so when the user opens the "owners tree" view, we should discard the previous width.
  if (ownerID !== prevOwnerIDRef.current) {
    prevOwnerIDRef.current = ownerID;
    indentationSizeRef.current = DEFAULT_INDENTATION_SIZE;
  }

  // When we render new content, measure to see if we need to shrink indentation to fit it.
  useEffect(() => {
    if (divRef.current !== null) {
      updateIndentationSizeVar(
        divRef.current,
        cachedChildWidths,
        indentationSizeRef,
        prevListWidthRef,
      );
    }
  });

  // This style override enables the background color to fill the full visible width,
  // when combined with the CSS tweaks in Element.
  // A lot of options were considered; this seemed the one that requires the least code.
  // See https://github.com/bvaughn/react-devtools-experimental/issues/9
  return (
    <div
      className={styles.InnerElementType}
      ref={divRef}
      style={{...style, pointerEvents: null}}>
      <SelectedTreeHighlight />
      {children}
    </div>
  );
}

function Loading() {
  return <div className={styles.Loading}>Loading...</div>;
}
