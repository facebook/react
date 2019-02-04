// @flow

import React, { useEffect, useMemo, useState } from 'react';
import Store from '../store';
import Tree from './Tree';
import { BridgeContext, StoreContext, TreeContext } from './context';
import SelectedElement from './SelectedElement';
import { SelectedElementController } from './SelectedElementContext';
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

  useEffect(() => {
    const handler = () => {
      setTreeContext({
        size: store.numElements,
        store,
      });
    };

    // Check for changes that happened between async render and passive effect.
    // (We had not yet subscribed to the store so we would have missed these.)
    if (treeContext.size !== store.numElements) {
      handler();
    }

    store.addListener('rootCommitted', handler);

    return () => store.removeListener('rootCommitted', handler);
  }, [store]);

  // TODO Flex wrappers below should be user resizable.
  return (
    <BridgeContext.Provider value={bridge}>
      <StoreContext.Provider value={store}>
        <TreeContext.Provider value={treeContext}>
          <SelectedElementController>
            <div className={styles.Elements}>
              <div className={styles.TreeWrapper}>
                <Tree />
              </div>
              <div className={styles.SelectedElementWrapper}>
                <SelectedElement />
              </div>
            </div>
          </SelectedElementController>
        </TreeContext.Provider>
      </StoreContext.Provider>
    </BridgeContext.Provider>
  );
}
