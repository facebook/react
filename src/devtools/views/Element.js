// @flow

import React, { Fragment, useContext } from 'react';
import { TreeContext } from './contexts';

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

  const { children, depth, displayName, key } = element;

  // TODO: Add state for toggling element open/close

  return (
    <div
      className={styles.Element}
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
