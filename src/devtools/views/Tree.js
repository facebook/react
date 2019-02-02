// @flow

import React, { useContext } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import Element from './Element';
import ButtonIcon from './ButtonIcon';
import { TreeContext } from './context';

import styles from './Tree.css';

type Props = {||};

export default function Tree(props: Props) {
  const treeContext = useContext(TreeContext);

  // TODO Add key handlers for selecting previous/next element.

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
          <ButtonIcon type="search" /> Select
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
