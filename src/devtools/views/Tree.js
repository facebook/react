// @flow

import React, { useContext, useEffect, useLayoutEffect, useRef } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import { SelectedElementContext } from './SelectedElementContext';
import Element from './Element';
import ButtonIcon from './ButtonIcon';
import { TreeContext } from './context';

import styles from './Tree.css';

type Props = {||};

export default function Tree(props: Props) {
  const selectedElementContext = useContext(SelectedElementContext);
  const treeContext = useContext(TreeContext);
  const listRef = useRef();

  // Make sure a newly selected element is visible in the list.
  // This is helpful for things like the owners list.
  useLayoutEffect(() => {
    const { index } = selectedElementContext;
    if (index !== null && listRef.current != null) {
      listRef.current.scrollToItem(index);
    }
  }, [listRef, selectedElementContext]);

  // Navigate the tree with up/down arrow keys.
  useEffect(() => {
    const handleKeyDown = event => {
      let index;

      // eslint-disable-next-line default-case
      switch (event.key) {
        case 'ArrowDown':
          index = selectedElementContext.index;
          if (index !== null && index + 1 < treeContext.size) {
            selectedElementContext.index = ((index: any): number) + 1;
          }
          event.preventDefault();
          break;
        case 'ArrowUp':
          index = selectedElementContext.index;
          if (index !== null && index > 0) {
            selectedElementContext.index = ((index: any): number) - 1;
          }
          event.preventDefault();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElementContext, treeContext]);

  return (
    <div className={styles.Tree}>
      <div className={styles.SearchRow}>
        <input
          className={styles.SearchInput}
          placeholder="Search (text or /regex/)"
        />
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
