// @flow

import React, { useContext, useMemo } from 'react';
import { TreeStateContext } from './TreeContext';
import { SettingsContext } from '../Settings/SettingsContext';
import TreeFocusedContext from './TreeFocusedContext';
import { StoreContext } from '../context';
import { useSubscription } from '../hooks';
import Store from '../../store';

import styles from './SelectedTreeHighlight.css';

type Data = {|
  startIndex: number,
  stopIndex: number,
|};

export default function SelectedTreeHighlight(_: {||}) {
  const { lineHeight } = useContext(SettingsContext);
  const store = useContext(StoreContext);
  const treeFocused = useContext(TreeFocusedContext);
  const { ownerID, selectedElementID } = useContext(TreeStateContext);

  const subscription = useMemo(
    () => ({
      getCurrentValue: () => {
        if (selectedElementID === null) {
          return null;
        }

        const element = store.getElementByID(selectedElementID);
        if (
          element === null ||
          element.isCollapsed ||
          element.children.length === 0
        ) {
          return null;
        }

        const startIndex = store.getIndexOfElementID(element.children[0]);
        if (startIndex === null) {
          return null;
        }

        let stopIndex = null;
        let current = element;
        while (current !== null) {
          if (current.isCollapsed || current.children.length === 0) {
            // We've found the last/deepest descendant.
            stopIndex = store.getIndexOfElementID(current.id);
            current = null;
          } else {
            const lastChildID = current.children[current.children.length - 1];
            current = store.getElementByID(lastChildID);
          }
        }

        if (stopIndex === null) {
          return null;
        }

        return {
          startIndex,
          stopIndex,
        };
      },
      subscribe: (callback: Function) => {
        store.addListener('mutated', callback);
        return () => {
          store.removeListener('mutated', callback);
        };
      },
    }),
    [selectedElementID, store]
  );
  const data = useSubscription<Data | null, Store>(subscription);

  if (ownerID !== null) {
    return null;
  }

  if (data === null) {
    return null;
  }

  const { startIndex, stopIndex } = data;

  return (
    <div
      className={treeFocused ? styles.Active : styles.Inactive}
      style={{
        position: 'absolute',
        top: `${startIndex * lineHeight - lineHeight / 2}px`,
        height: `${(stopIndex + 1 - startIndex) * lineHeight +
          lineHeight / 2}px`,
      }}
    />
  );
}
