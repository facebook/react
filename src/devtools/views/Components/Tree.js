// @flow

import React, {
  Suspense,
  useState,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useLayoutEffect,
  useRef,
} from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import { TreeDispatcherContext, TreeStateContext } from './TreeContext';
import { SettingsContext } from '../Settings/SettingsContext';
import { BridgeContext, StoreContext } from '../context';
import ElementView from './Element';
import InspectHostNodesToggle from './InspectHostNodesToggle';
import OwnersStack from './OwnersStack';
import SearchInput from './SearchInput';
import { ComponentFiltersModalContextController } from './ComponentFiltersModalContext';
import ToggleComponentFiltersModalButton from './ToggleComponentFiltersModalButton';
import ComponentFiltersModal from './ComponentFiltersModal';
import Guideline from './Guideline';
import TreeFocusedContext from './TreeFocusedContext';

import styles from './Tree.css';

export type ItemData = {|
  numElements: number,
  isNavigatingWithKeyboard: boolean,
  lastScrolledIDRef: { current: number | null },
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
    false
  );
  // $FlowFixMe https://github.com/facebook/flow/issues/7341
  const listRef = useRef<FixedSizeList<ItemData> | null>(null);
  const treeRef = useRef<HTMLDivElement | null>(null);
  const focusTargetRef = useRef<HTMLDivElement | null>(null);

  const [treeFocused, setTreeFocused] = useState<boolean>(false);

  const { lineHeight } = useContext(SettingsContext);

  // Make sure a newly selected element is visible in the list.
  // This is helpful for things like the owners list and search.
  useLayoutEffect(() => {
    if (selectedElementIndex !== null && listRef.current != null) {
      listRef.current.scrollToItem(selectedElementIndex, 'smart');
      // Note this autoscroll only works for rows.
      // There's another autoscroll inside the elements
      // that ensures the component name is visible horizontally.
      // It's too early to do it now because the row might not exist yet.
    }
  }, [listRef, selectedElementIndex]);

  // Picking an element in the inspector should put focus into the tree.
  // This ensures that keyboard navigation works right after picking a node.
  useEffect(() => {
    function handleStopInspectingDOM(didSelectNode) {
      if (didSelectNode && focusTargetRef.current !== null) {
        focusTargetRef.current.focus();
      }
    }
    bridge.addListener('stopInspectingDOM', handleStopInspectingDOM);
    return () =>
      bridge.removeListener('stopInspectingDOM', handleStopInspectingDOM);
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

      let element;
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          dispatch({ type: 'SELECT_NEXT_ELEMENT_IN_TREE' });
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
              dispatch({ type: 'SELECT_PARENT_ELEMENT_IN_TREE' });
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
              dispatch({ type: 'SELECT_CHILD_ELEMENT_IN_TREE' });
            }
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          dispatch({ type: 'SELECT_PREVIOUS_ELEMENT_IN_TREE' });
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
            dispatch({ type: 'SELECT_OWNER', payload: selectedElementID });
          }
          break;
        default:
          break;
      }
    },
    [dispatch, selectedElementID]
  );

  const highlightElementInDOM = useCallback(
    (id: number) => {
      const element = store.getElementByID(id);
      const rendererID = store.getRendererIDForElement(id);
      if (element !== null) {
        bridge.send('highlightElementInDOM', {
          displayName: element.displayName,
          hideAfterTimeout: false,
          id,
          openNativeElementsPanel: false,
          rendererID,
          scrollIntoView: false,
        });
      }
    },
    [store, bridge]
  );

  // If we switch the selected element while using the keyboard,
  // start highlighting it in the DOM instead of the last hovered node.
  const searchRef = useRef({ searchIndex, searchResults });
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
        highlightElementInDOM(selectedElementID);
      } else {
        bridge.send('clearHighlightedElementInDOM');
      }
    }
  }, [
    bridge,
    isNavigatingWithKeyboard,
    highlightElementInDOM,
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
        highlightElementInDOM(id);
      }
    },
    [isNavigatingWithKeyboard, highlightElementInDOM]
  );

  const handleMouseMove = useCallback(() => {
    // We started using the mouse again.
    // This will enable hover styles in individual rows.
    setIsNavigatingWithKeyboard(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    bridge.send('clearHighlightedElementInDOM');
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
    ]
  );

  return (
    <TreeFocusedContext.Provider value={treeFocused}>
      <ComponentFiltersModalContextController>
        <div className={styles.Tree} ref={treeRef}>
          <div className={styles.SearchInput}>
            <InspectHostNodesToggle />
            <div className={styles.VRule} />
            <Suspense fallback={<Loading />}>
              {ownerID !== null ? <OwnersStack /> : <SearchInput />}
            </Suspense>
            <div className={styles.VRule} />
            <ToggleComponentFiltersModalButton />
          </div>
          <div
            className={styles.AutoSizerWrapper}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyPress={handleKeyPress}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            ref={focusTargetRef}
            tabIndex={0}
          >
            <AutoSizer>
              {({ height, width }) => (
                // $FlowFixMe https://github.com/facebook/flow/issues/7341
                <FixedSizeList
                  className={styles.List}
                  height={height}
                  innerElementType={InnerElementType}
                  itemCount={numElements}
                  itemData={itemData}
                  itemSize={lineHeight}
                  ref={listRef}
                  width={width}
                >
                  {ElementView}
                </FixedSizeList>
              )}
            </AutoSizer>
          </div>
          <ComponentFiltersModal />
        </div>
      </ComponentFiltersModalContextController>
    </TreeFocusedContext.Provider>
  );
}

let debounceTimeoutID: TimeoutID | null = null;
function debounce(callback: () => void, delay: number) {
  if (debounceTimeoutID !== null) {
    clearTimeout(debounceTimeoutID);
  }
  debounceTimeoutID = setTimeout(callback, delay);
}

function updateIndentationSizeVar(
  innerDiv: HTMLDivElement,
  indentationSizeRef: {| current: number |},
  cachedChildWidths: WeakMap<HTMLElement, number>
): void {
  const list = ((innerDiv.parentElement: any): HTMLDivElement);

  let maxChildWidth = 0;
  for (let child of innerDiv.children) {
    const depth = parseInt(child.getAttribute('data-depth'), 10) || 0;

    let childWidth: number = 0;

    const cachedChildWidth = cachedChildWidths.get(child);
    if (cachedChildWidth != null) {
      childWidth = cachedChildWidth;
    } else {
      const { firstElementChild, lastElementChild } = child;

      // Skip over e.g. the guideline element
      if (firstElementChild != null && lastElementChild != null) {
        const firstBounds = ((firstElementChild.getBoundingClientRect(): any): DOMRect);
        const lastBounds = ((lastElementChild.getBoundingClientRect(): any): DOMRect);

        childWidth = lastBounds.x + lastBounds.width - firstBounds.x;
        cachedChildWidths.set(child, childWidth);
      }
    }

    const childWidthIncludingIndentation =
      indentationSizeRef.current * depth + childWidth;
    maxChildWidth = Math.max(maxChildWidth, childWidthIncludingIndentation);
  }

  const indentationSize = Math.min(
    12,
    (list.clientWidth / maxChildWidth) * indentationSizeRef.current
  );

  indentationSizeRef.current = indentationSize;

  // Debounce so newly added rows animate with pre-existing ones
  debounce(() => {
    list.style.setProperty('--indentation-size', `${indentationSize}px`);
  }, 50);
}

function InnerElementType({ children, style, ...rest }) {
  const { ownerID } = useContext(TreeStateContext);

  const indentationSizeRef = useRef<number>(12);
  const cachedChildWidths = useMemo<WeakMap<HTMLElement, number>>(
    () => new WeakMap(),
    []
  );

  // The list may need to scroll horizontally due to deeply nested elements.
  // We don't know the maximum scroll width up front, because we're windowing.
  // What we can do instead, is passively measure the width of the current rows,
  // and ensure that once we've grown to a new max size, we don't shrink below it.
  // This improves the user experience when scrolling between wide and narrow rows.
  const divRef = useRef<HTMLDivElement | null>(null);

  // TODO This is a valid warning, but we're ignoring it for the time being.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (divRef.current !== null) {
      updateIndentationSizeVar(
        divRef.current,
        indentationSizeRef,
        cachedChildWidths
      );
    }
  });

  // We shouldn't retain this width across different conceptual trees though,
  // so when the user opens the "owners tree" view, we should discard the previous width.
  const [prevOwnerID, setPrevOwnerID] = useState(ownerID);
  if (ownerID !== prevOwnerID) {
    setPrevOwnerID(ownerID);
  }

  // This style override enables the background color to fill the full visible width,
  // when combined with the CSS tweaks in Element.
  // A lot of options were considered; this seemed the one that requires the least code.
  // See https://github.com/bvaughn/react-devtools-experimental/issues/9
  return (
    <div
      className={styles.InnerElementType}
      style={style}
      ref={divRef}
      {...rest}
    >
      <Guideline />
      {children}
    </div>
  );
}

function Loading() {
  return <div className={styles.Loading}>Loading...</div>;
}
