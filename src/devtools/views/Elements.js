// @flow

import React, { useLayoutEffect, useMemo, useState } from 'react';
import Store from '../store';
import Tree from './Tree';
import { StoreContext, TreeContext } from './contexts';
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={styles.IconButtonSVG}
                width="24"
                height="24"
                viewBox="0 0 24 24"
              >
                <path d="M0 0h24v24H0z" fill="none" />
                <path
                  fill="currentColor"
                  d="M20.94 11c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"
                />
              </svg>
              Select
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
