// @flow

import React, {
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
import Element from './Element';
import InspectHostNodesToggle from './InspectHostNodesToggle';
import OwnersStack from './OwnersStack';
import SearchInput from './SearchInput';

import styles from './Tree.css';

type Props = {||};

export default function Tree(props: Props) {
  const {
    baseDepth,
    getElementAtIndex,
    numElements,
    ownerStack,
    selectedElementIndex,
    selectNextElementInTree,
    selectParentElementInTree,
    selectPreviousElementInTree,
  } = useContext(TreeContext);
  const listRef = useRef<FixedSizeList<any> | null>(null);
  const treeRef = useRef<HTMLDivElement | null>(null);

  const { lineHeight } = useContext(SettingsContext);

  // Make sure a newly selected element is visible in the list.
  // This is helpful for things like the owners list.
  useLayoutEffect(() => {
    if (selectedElementIndex !== null && listRef.current != null) {
      listRef.current.scrollToItem(selectedElementIndex);
    }
  }, [listRef, selectedElementIndex]);

  // Navigate the tree with up/down arrow keys.
  useEffect(() => {
    if (treeRef.current === null) {
      return () => {};
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // eslint-disable-next-line default-case
      switch (event.key) {
        case 'ArrowDown':
          selectNextElementInTree();
          event.preventDefault();
          break;
        case 'ArrowLeft':
          console.log('LEFT');
          selectParentElementInTree();
          break;
        case 'ArrowRight':
          selectNextElementInTree();
          event.preventDefault();
          break;
        case 'ArrowUp':
          selectPreviousElementInTree();
          event.preventDefault();
          break;
      }
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
    selectNextElementInTree,
    selectParentElementInTree,
    selectPreviousElementInTree,
  ]);

  // Let react-window know to re-render any time the underlying tree data changes.
  // This includes the owner context, since it controls a filtered view of the tree.
  const itemData = useMemo(
    () => ({
      baseDepth,
      numElements,
      getElementAtIndex,
    }),
    [baseDepth, numElements, getElementAtIndex]
  );

  return (
    <div className={styles.Tree} ref={treeRef}>
      <div className={styles.SearchInput}>
        {ownerStack.length > 0 ? <OwnersStack /> : <SearchInput />}
        <InspectHostNodesToggle />
      </div>
      <div className={styles.AutoSizerWrapper}>
        <AutoSizer>
          {({ height, width }) => (
            <FixedSizeList
              className={styles.List}
              height={height}
              innerElementType={innerElementType}
              itemCount={numElements}
              itemData={itemData}
              itemSize={lineHeight}
              ref={listRef}
              width={width}
            >
              {Element}
            </FixedSizeList>
          )}
        </AutoSizer>
      </div>
    </div>
  );
}

// This style override enables the background color to fill the full visible width,
// when combined with the CSS tweaks in Element.
// A lot of options were considered; this seemed the one that requires the least code.
// See https://github.com/bvaughn/react-devtools-experimental/issues/9
const innerElementType = ({ style, ...rest }) => (
  <div
    style={{
      ...style,
      display: 'inline-block',
      minWidth: '100%',
      width: undefined,
    }}
    {...rest}
  />
);
