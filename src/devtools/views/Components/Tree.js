// @flow

import React, {
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
import { TreeContext } from './TreeContext';
import { SettingsContext } from '../Settings/SettingsContext';
import { BridgeContext, StoreContext } from '../context';
import ElementView from './Element';
import InspectHostNodesToggle from './InspectHostNodesToggle';
import OwnersStack from './OwnersStack';
import SearchInput from './SearchInput';

import styles from './Tree.css';

import type { Element } from './types';

export type ItemData = {|
  baseDepth: number,
  numElements: number,
  getElementAtIndex: (index: number) => Element | null,
  isNavigatingWithKeyboard: boolean,
  lastScrolledIDRef: { current: number | null },
  onElementMouseEnter: (id: number) => void,
  treeFocused: boolean,
|};

type Props = {||};

export default function Tree(props: Props) {
  const {
    baseDepth,
    getElementAtIndex,
    numElements,
    ownerStack,
    searchIndex,
    searchResults,
    selectedElementID,
    selectedElementIndex,
    selectChildElementInTree,
    selectElementAtIndex,
    selectNextElementInTree,
    selectOwner,
    selectParentElementInTree,
    selectPreviousElementInTree,
  } = useContext(TreeContext);
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
          selectNextElementInTree();
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
              selectParentElementInTree();
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
              selectChildElementInTree();
            }
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          selectPreviousElementInTree();
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
  }, [
    selectedElementID,
    selectChildElementInTree,
    selectNextElementInTree,
    selectParentElementInTree,
    selectPreviousElementInTree,
    store,
  ]);

  // Focus management.
  const handleBlur = useCallback(() => setTreeFocused(false));
  const handleFocus = useCallback(() => {
    setTreeFocused(true);

    if (selectedElementIndex === null && numElements > 0) {
      selectElementAtIndex(0);
    }
  }, [numElements, selectedElementIndex, selectElementAtIndex]);

  const handleKeyPress = useCallback(
    event => {
      switch (event.key) {
        case 'Enter':
        case ' ':
          if (selectedElementID !== null) {
            selectOwner(selectedElementID);
          }
          break;
        default:
          break;
      }
    },
    [selectedElementID, selectOwner]
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
      baseDepth,
      numElements,
      getElementAtIndex,
      isNavigatingWithKeyboard,
      onElementMouseEnter: handleElementMouseEnter,
      lastScrolledIDRef,
      treeFocused,
    }),
    [
      baseDepth,
      numElements,
      getElementAtIndex,
      isNavigatingWithKeyboard,
      handleElementMouseEnter,
      lastScrolledIDRef,
      treeFocused,
    ]
  );

  return (
    <div className={styles.Tree} ref={treeRef}>
      <div className={styles.SearchInput}>
        {ownerStack.length > 0 ? <OwnersStack /> : <SearchInput />}
        <InspectHostNodesToggle />
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
              overscanCount={3}
              ref={listRef}
              width={width}
            >
              {ElementView}
            </FixedSizeList>
          )}
        </AutoSizer>
      </div>
    </div>
  );
}

function InnerElementType({ style, ...rest }) {
  const { ownerStack } = useContext(TreeContext);

  // The list may need to scroll horizontally due to deeply nested elements.
  // We don't know the maximum scroll width up front, because we're windowing.
  // What we can do instead, is passively measure the width of the current rows,
  // and ensure that once we've grown to a new max size, we don't shrink below it.
  // This improves the user experience when scrolling between wide and narrow rows.
  // We shouldn't retain this width across different conceptual trees though,
  // so when the user opens the "owners tree" view, we should discard the previous width.
  const divRef = useRef<HTMLDivElement | null>(null);
  const minWidthRef = useRef<number | null>(null);
  const minWidth =
    ownerStack.length > 0 || minWidthRef.current === null
      ? '100%'
      : minWidthRef.current;
  useEffect(() => {
    if (divRef.current !== null) {
      minWidthRef.current = Math.max(
        minWidthRef.current || 0,
        divRef.current.offsetWidth
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
      style={{
        ...style,
        display: 'inline-block',
        minWidth,
        width: undefined,
      }}
      ref={divRef}
      {...rest}
    />
  );
}
