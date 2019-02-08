// @flow

import React, { useMemo } from 'react';
import Store from '../store';
import Tree from './Tree';
import { BridgeContext, StoreContext } from './context';
import SelectedElement from './SelectedElement';
import { TreeContextController } from './TreeContext';
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

  // TODO Flex wrappers below should be user resizable.
  return (
    <BridgeContext.Provider value={bridge}>
      <StoreContext.Provider value={store}>
        <TreeContextController>
          <div className={styles.Elements}>
            <div className={styles.TreeWrapper}>
              <Tree />
            </div>
            <div className={styles.SelectedElementWrapper}>
              <SelectedElement />
            </div>
          </div>
        </TreeContextController>
      </StoreContext.Provider>
    </BridgeContext.Provider>
  );
}
