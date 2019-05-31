// @flow

import React, { useContext, useMemo } from 'react';
import { TreeStateContext } from './TreeContext';
import TreeFocusedContext from './TreeFocusedContext';
import { SettingsContext } from '../Settings/SettingsContext';
import { StoreContext } from '../context';
import { useSubscription } from '../hooks';
import Store from '../../store';

import styles from './Guideline.css';

type Data = {|
  depth: number,
  startIndex: number,
  stopIndex: number,
|};

export default function Guideline(_: {||}) {
  const { lineHeight } = useContext(SettingsContext);
  const store = useContext(StoreContext);
  const { selectedElementID } = useContext(TreeStateContext);
  const treeFocused = useContext(TreeFocusedContext);

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
          depth: element.depth,
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

  if (data === null) {
    return null;
  }

  const { depth, startIndex, stopIndex } = data;

  return (
    <div
      className={
        treeFocused ? styles.GuidelineActive : styles.GuidelineInactive
      }
      style={{
        position: 'absolute',
        top: `${startIndex * lineHeight}px`,
        left: `calc(${depth} * var(--indentation-size) + 0.5rem)`,
        height: `${(stopIndex + 1 - startIndex) * lineHeight}px`,
      }}
    />
  );
}
