/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
import {SettingsContext} from '../Settings/SettingsContext';
import {BridgeContext, StoreContext} from '../context';
import ElementView from './Element';
import InspectHostNodesToggle from './InspectHostNodesToggle';
import OwnersStack from './OwnersStack';
import SearchInput from './SearchInput';
import SettingsModalContextToggle from 'react-devtools-shared/src/devtools/views/Settings/SettingsModalContextToggle';
import SelectedTreeHighlight from './SelectedTreeHighlight';
import TreeFocusedContext from './TreeFocusedContext';

import styles from './Tree.css';

// Never indent more than this number of pixels (even if we have the room).
const DEFAULT_INDENTATION_SIZE = 12;

export type ItemData = {|
  numElements: number,
  isNavigatingWithKeyboard: boolean,
  lastScrolledIDRef: {current: number | null, ...},
  onElementMouseEnter: (id: number) => void,
  treeFocused: boolean,
|};

type Props = {||};

export default function Tree(props: Props) {
  const dispatch = useContext(TreeDispatcherContext);
  const {
    numElements,
    ownerID,
    searchIndex,
    searchResults,
    selectedElementID,
    selectedElementIndex,
  } = useContext(TreeStateContext);
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);
  const [isNavigatingWithKeyboard, setIsNavigatingWithKeyboard] = useState(
    false,
  );
  const treeRef = useRef<HTMLDivElement | null>(null);
  const focusTargetRef = useRef<HTMLDivElement | null>(null);

  const [treeFocused, setTreeFocused] = useState<boolean>(false);

  const {lineHeight} = useContext(SettingsContext);

  // Make sure a newly selected element is visible in the list.
  // This is helpful for things like the owners list and search.
  //
  // TRICKY:
  // It's important to use a callback ref for this, rather than a ref object and an effect.
  // As an optimization, the AutoSizer component does not render children when their size would be 0.
  // This means that in some cases (if the browser panel size is initially really small),
  // the Tree component might render without rendering an inner List.
  // In this case, the list ref would be null on mount (when the scroll effect runs),
  // meaning the scroll action would be skipped (since ref updates don't re-run effects).
  // Using a callback ref accounts for this case...
  const listCallbackRef = useCallback(
    list => {
      if (list != null && selectedElementIndex !== null) {
        list.scrollToItem(selectedElementIndex, 'smart');
      }
    },
    [selectedElementIndex],
  );

  // Picking an element in the inspector should put focus into the tree.
  // This ensures that keyboard navigation works right after picking a node.
  useEffect(() => {
    function handleStopInspectingNative(didSelectNode) {
      if (didSelectNode && focusTargetRef.current !== null) {
        focusTargetRef.current.focus();
      }
    }
    bridge.addListener('stopInspectingNative', handleStopInspectingNative);
    return () =>
      bridge.removeListener('stopInspectingNative', handleStopInspectingNative);
  }, [bridge]);

  // This ref is passed down the context to elements.
  // It lets them avoid autoscrolling to the same item many times
  // when a selected virtual row goes in and out of the viewport.
  const lastScrolledIDRef = useRef<number | null>(null);

  // Navigate the tree with up/down arrow keys.
  useEffect(() => {
    if (treeRef.current === null) {
      return () => {};
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event: any).target.tagName === 'INPUT' || event.defaultPrevented) {
        return;
      }

      // TODO We should ignore arrow keys if the focus is outside of DevTools.
      // Otherwise the inline (embedded) DevTools might change selection unexpectedly,
      // e.g. when a text input or a select has focus.

      let element;
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          dispatch({type: 'SELECT_NEXT_ELEMENT_IN_TREE'});
          break;
        case 'ArrowLeft':
          event.preventDefault();
          element =
            selectedElementID !== null
              ? store.getElementByID(selectedElementID)
              : null;
          if (element !== null) {
            if (element.children.length > 0 && !element.isCollapsed) {
              store.toggleIsCollapsed(element.id, true);
            } else {
              dispatch({type: 'SELECT_PARENT_ELEMENT_IN_TREE'});
            }
          }
          break;
        case 'ArrowRight':
          event.preventDefault();
          element =
            selectedElementID !== null
              ? store.getElementByID(selectedElementID)
              : null;
          if (element !== null) {
            if (element.children.length > 0 && element.isCollapsed) {
              store.toggleIsCollapsed(element.id, false);
            } else {
              dispatch({type: 'SELECT_CHILD_ELEMENT_IN_TREE'});
            }
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          dispatch({type: 'SELECT_PREVIOUS_ELEMENT_IN_TREE'});
          break;
        default:
          return;
      }
      setIsNavigatingWithKeyboard(true);
    };

    // It's important to listen to the ownerDocument to support the browser extension.
    // Here we use portals to render individual tabs (e.g. Profiler),
    // and the root document might belong to a different window.
    const ownerDocument = treeRef.current.ownerDocument;
    ownerDocument.addEventListener('keydown', handleKeyDown);

    return () => {
      ownerDocument.removeEventListener('keydown', handleKeyDown);
    };
  }, [dispatch, selectedElementID, store]);

  // Focus management.
  const handleBlur = useCallback(() => setTreeFocused(false), []);
  const handleFocus = useCallback(() => {
    setTreeFocused(true);

    if (selectedElementIndex === null && numElements > 0) {
      dispatch({
        type: 'SELECT_ELEMENT_AT_INDEX',
        payload: 0,
      });
    }
  }, [dispatch, numElements, selectedElementIndex]);

  const handleKeyPress = useCallback(
    event => {
      switch (event.key) {
        case 'Enter':
        case ' ':
          if (selectedElementID !== null) {
            dispatch({type: 'SELECT_OWNER', payload: selectedElementID});
          }
          break;
        default:
          break;
      }
    },
    [dispatch, selectedElementID],
  );

  const highlightNativeElement = useCallback(
    (id: number) => {
      const element = store.getElementByID(id);
      const rendererID = store.getRendererIDForElement(id);
      if (element !== null && rendererID !== null) {
        bridge.send('highlightNativeElement', {
          displayName: element.displayName,
          hideAfterTimeout: false,
          id,
          openNativeElementsPanel: false,
          rendererID,
          scrollIntoView: false,
        });
      }
    },
    [store, bridge],
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
      if (selectedElementID !== null) {
        highlightNativeElement(selectedElementID);
      } else {
        bridge.send('clearNativeElementHighlight');
      }
    }
  }, [
    bridge,
    isNavigatingWithKeyboard,
    highlightNativeElement,
    searchIndex,
    searchResults,
    selectedElementID,
  ]);

  // Highlight last hovered element.
  const handleElementMouseEnter = useCallback(
    id => {
      // Ignore hover while we're navigating with keyboard.
      // This avoids flicker from the hovered nodes under the mouse.
      if (!isNavigatingWithKeyboard) {
        highlightNativeElement(id);
      }
    },
    [isNavigatingWithKeyboard, highlightNativeElement],
  );

  const handleMouseMove = useCallback(() => {
    // We started using the mouse again.
    // This will enable hover styles in individual rows.
    setIsNavigatingWithKeyboard(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    bridge.send('clearNativeElementHighlight');
  }, [bridge]);

  // Let react-window know to re-render any time the underlying tree data changes.
  // This includes the owner context, since it controls a filtered view of the tree.
  const itemData = useMemo<ItemData>(
    () => ({
      numElements,
      isNavigatingWithKeyboard,
      onElementMouseEnter: handleElementMouseEnter,
      lastScrolledIDRef,
      treeFocused,
    }),
    [
      numElements,
      isNavigatingWithKeyboard,
      handleElementMouseEnter,
      lastScrolledIDRef,
      treeFocused,
    ],
  );

  const itemKey = useCallback(
    (index: number) => store.getElementIDAtIndex(index),
    [store],
  );

  return (
    <TreeFocusedContext.Provider value={treeFocused}>
      <div className={styles.Tree} ref={treeRef}>
        <div className={styles.SearchInput}>
          {store.supportsNativeInspection && (
            <Fragment>
              <InspectHostNodesToggle />
              <div className={styles.VRule} />
            </Fragment>
          )}
          <Suspense fallback={<Loading />}>
            {ownerID !== null ? <OwnersStack /> : <SearchInput />}
          </Suspense>
          <div className={styles.VRule} />
          <SettingsModalContextToggle />
        </div>
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
              // $FlowFixMe https://github.com/facebook/flow/issues/7341
              <FixedSizeList
                className={styles.List}
                height={height}
                innerElementType={InnerElementType}
                itemCount={numElements}
                itemData={itemData}
                itemKey={itemKey}
                itemSize={lineHeight}
                ref={listCallbackRef}
                width={width}>
                {ElementView}
              </FixedSizeList>
            )}
          </AutoSizer>
        </div>
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
  indentationSizeRef: {|current: number|},
  prevListWidthRef: {|current: number|},
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
  for (let child of innerDiv.children) {
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

function InnerElementType({children, style, ...rest}) {
  const {ownerID} = useContext(TreeStateContext);

  const cachedChildWidths = useMemo<WeakMap<HTMLElement, number>>(
    () => new WeakMap(),
    [],
  );

  // This ref tracks the current indentation size.
  // We decrease indentation to fit wider/deeper trees.
  // We indentionally do not increase it again afterward, to avoid the perception of content "jumping"
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
      style={style}
      {...rest}>
      <SelectedTreeHighlight />
      {children}
    </div>
  );
}

function Loading() {
  return <div className={styles.Loading}>Loading...</div>;
}
