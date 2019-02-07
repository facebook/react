// @flow

import React, { useContext, useEffect, useLayoutEffect, useRef } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import { SearchAndSelectionContext } from './SearchAndSelectionContext';
import ButtonIcon from './ButtonIcon';
import Element from './Element';
import SearchInput from './SearchInput';
import { TreeContext } from './context';

import styles from './Tree.css';

type Props = {||};

export default function Tree(props: Props) {
  const { selectedElementIndex, selectElementAtIndex } = useContext(
    SearchAndSelectionContext
  );
  const treeContext = useContext(TreeContext);
  const listRef = useRef<FixedSizeList<any>>();

  // Make sure a newly selected element is visible in the list.
  // This is helpful for things like the owners list.
  useLayoutEffect(() => {
    if (selectedElementIndex !== null && listRef.current != null) {
      listRef.current.scrollToItem(selectedElementIndex);
    }
  }, [listRef, selectedElementIndex]);

  // Navigate the tree with up/down arrow keys.
  useEffect(() => {
    const handleKeyDown = event => {
      // eslint-disable-next-line default-case
      switch (event.key) {
        case 'ArrowDown':
          if (
            selectedElementIndex !== null &&
            selectedElementIndex + 1 < treeContext.size
          ) {
            selectElementAtIndex(((selectedElementIndex: any): number) + 1);
          }
          event.preventDefault();
          break;
        case 'ArrowUp':
          if (selectedElementIndex !== null && selectedElementIndex > 0) {
            selectElementAtIndex(((selectedElementIndex: any): number) - 1);
          }
          event.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElementIndex, selectElementAtIndex, treeContext]);

  return (
    <div className={styles.Tree}>
      <div className={styles.SearchInput}>
        <SearchInput />
        <button
          className={styles.IconButton}
          title="Select an element in the page to inspect it"
        >
          <ButtonIcon type="search" />
        </button>
      </div>
      <div className={styles.AutoSizerWrapper}>
        <AutoSizer>
          {({ height, width }) => (
            <FixedSizeList
              className={styles.List}
              height={height}
              itemCount={treeContext.size}
              itemData={treeContext}
              itemSize={20}
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
