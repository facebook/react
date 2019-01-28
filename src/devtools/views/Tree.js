// @flow

import React, { useContext, useMemo } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import Element from './Element';
import { TreeContext } from './contexts';

import styles from './Tree.css';

type Props = {||};

export default function Tree(props: Props) {
  const treeContext = useContext(TreeContext);

  return (
    <AutoSizer>
      {({ height, width }) => (
        <FixedSizeList
          className={styles.Tree}
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
  );
}
