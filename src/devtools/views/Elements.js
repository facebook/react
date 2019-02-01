// @flow

import React, { useLayoutEffect, useMemo, useState } from 'react';
import Store from '../store';
import Tree from './Tree';
import { StoreContext, TreeContext } from './context';
import SearchIcon from './SearchIcon';
import styles from './Elements.css';

import './root.css';

import type { Bridge } from '../../types';

export type Props = {|
  bridge: Bridge,
  browserName: string,
  themeName: string,
|};

export default function Elements({ bridge, browserName, themeName }: Props) {
  const store = useMemo<Store>(() => new Store(bridge), []);

  const [treeContext, setTreeContext] = useState({
    size: store.numElements,
    store,
  });

  useLayoutEffect(() => {
    const handler = () => {
      setTreeContext({
        size: store.numElements,
        store,
      });
    };

    store.addListener('rootCommitted', handler);

    return () => store.removeListener('rootCommitted', handler);
  }, [store]);

  return (
    <StoreContext.Provider value={store}>
      <TreeContext.Provider value={treeContext}>
        <div className={styles.Elements}>
          <div className={styles.SearchRow}>
            <input
              className={styles.SearchInput}
              placeholder="Search (text or /regex/)"
            />
            <button className={styles.IconButton}>
              <SearchIcon /> Select
            </button>
          </div>
          <div className={styles.Tree}>
            <Tree />
          </div>
        </div>
      </TreeContext.Provider>
    </StoreContext.Provider>
  );
}
