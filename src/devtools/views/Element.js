// @flow

import React, { Fragment, useCallback, useContext } from 'react';
import { TreeContext } from './context';
import { SelectedElementContext } from './SelectedElementContext';

import styles from './Element.css';

type Props = {
  index: number,
  style: Object,
};

export default function Element({ index, style }: Props) {
  const { store } = useContext(TreeContext);
  const element = store.getElementAtIndex(index);

  // DevTools are rendered in concurrent mode.
  // It's possible the store has updated since the commit that triggered this render.
  // So we need to guard against an undefined element.
  // TODO: Handle this by switching to a Suspense based approach.
  if (element == null) {
    return null;
  }

  const { children, depth, displayName, id, key } = element;

  const selectedElement = useContext(SelectedElementContext);
  const handleClick = useCallback(
    ({ metaKey }) => {
      selectedElement.id = metaKey ? null : id;
    },
    [id]
  );

  // TODO: Add click and key handlers for toggling element open/close state.

  return (
    <div
      className={
        selectedElement.id === id ? styles.SelectedElement : styles.Element
      }
      onClick={handleClick}
      style={{
        ...style,
        paddingLeft: `${1 + depth}rem`,
      }}
    >
      {children.length > 0 && <span className={styles.ArrowOpen} />}

      <span className={styles.Component}>
        {displayName}
        {key && (
          <Fragment>
            &nbsp;<span className={styles.AttributeName}>key</span>=
            <span className={styles.AttributeValue}>"{key}"</span>
          </Fragment>
        )}
      </span>
    </div>
  );
}
