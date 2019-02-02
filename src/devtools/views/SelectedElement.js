// @flow

import React, { useContext } from 'react';
import { SelectedElementContext } from './SelectedElementContext';
import { StoreContext } from './context';
import ButtonIcon from './ButtonIcon';
import styles from './SelectedElement.css';

export type Props = {||};

export default function SelectedElement(props: Props) {
  const { id } = useContext(SelectedElementContext);
  const store = useContext(StoreContext);
  const element = id !== null ? store.getElementByID(id) : null;

  // TODO Show/hide source button based on whether debug "source" is available.

  if (element === null) {
    return (
      <div className={styles.SelectedElement}>
        <div className={styles.TitleRow} />
      </div>
    );
  }

  return (
    <div className={styles.SelectedElement}>
      <div className={styles.TitleRow}>
        <div className={styles.SelectedComponentName}>
          <div className={styles.Component} title={element.displayName}>
            {element.displayName}
          </div>
        </div>

        <button
          className={styles.IconButton}
          title="Highlight this element in the page"
        >
          <ButtonIcon type="view-dom" /> DOM
        </button>
        <button
          className={styles.IconButton}
          title="View source for this element"
        >
          <ButtonIcon type="view-source" /> Source
        </button>
      </div>
    </div>
  );
}
