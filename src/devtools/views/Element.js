// @flow

import React, { Fragment, useContext } from 'react';
import { useElement } from './hooks';
import { StoreContext } from './contexts';

import styles from './Element.css';

type Props = {|
  depth: number,
  id: string,
|};

export default function Element({ depth, id }: Props) {
  const store = useContext(StoreContext);
  const element = useElement(store, id);

  const { children, displayName, key } = element;

  // TODO: Toggle open/close state

  return (
    <Fragment>
      <div
        className={styles.Element}
        style={{ paddingLeft: `${1 + depth}rem` }}
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

      {children.map(childID => (
        <Element key={childID} depth={depth + 1} id={childID} />
      ))}
    </Fragment>
  );
}
