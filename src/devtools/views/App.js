// @flow

import React, { useMemo } from 'react';
import Store from '../store';
import Tree from './Tree';
import { StoreContext } from './contexts';
import styles from './App.css';

import type { Bridge } from '../../types';

type Props = {|
  bridge: Bridge,
|};

export default function App({ bridge }: Props) {
  const store = useMemo(() => new Store(bridge), []);

  return (
    <StoreContext.Provider value={store}>
      <div className={styles.App}>
        <Tree />
      </div>
    </StoreContext.Provider>
  );
}
