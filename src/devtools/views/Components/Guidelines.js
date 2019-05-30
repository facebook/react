// @flow

import React, { Fragment, useContext, useMemo } from 'react';
import { HoveredElementIDContext } from './HoveredElementContext';
import { TreeStateContext } from './TreeContext';
import TreeFocusedContext from './TreeFocusedContext';
import { SettingsContext } from '../Settings/SettingsContext';
import { StoreContext } from '../context';
import { useSubscription } from '../hooks';
import Store from '../../store';

import styles from './Guidelines.css';

export default function Guidelines(_: {||}) {
  const hoveredElementID = useContext(HoveredElementIDContext);
  const { selectedElementID } = useContext(TreeStateContext);
  const treeFocused = useContext(TreeFocusedContext);

  return (
    <Fragment>
      {hoveredElementID !== selectedElementID && (
        <Guideline
          className={styles.GuidelineHovered}
          elementID={hoveredElementID}
        />
      )}
      <Guideline
        className={
          treeFocused
            ? styles.GuidelineSelectedActive
            : styles.GuidelineSelectedInactive
        }
        elementID={selectedElementID}
      />
    </Fragment>
  );
}

type Data = {|
  depth: number,
  startIndex: number,
  stopIndex: number,
|};

type Props = {|
  className: string,
  elementID: number | null,
|};

function Guideline({ className, elementID }: Props) {
  const store = useContext(StoreContext);
  const { lineHeight } = useContext(SettingsContext);

  const subscription = useMemo(
    () => ({
      getCurrentValue: () => {
        if (elementID === null) {
          return null;
        }

        const element = store.getElementByID(elementID);
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
    [elementID, store]
  );
  const data = useSubscription<Data | null, Store>(subscription);

  if (data === null) {
    return null;
  }

  const { depth, startIndex, stopIndex } = data;

  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        top: `${startIndex * lineHeight}px`,
        left: `${depth * 0.75 + 0.75}rem`,
        height: `${(stopIndex + 1 - startIndex) * lineHeight}px`,
      }}
    />
  );
}
