// @flow

import React, { useCallback } from 'react';
import styles from './ListItem.css';

import type { Item } from './List';

type Props = {|
  item: Item,
  removeItem: (item: Item) => void,
  toggleItem: (item: Item) => void,
|};

export default function ListItem({ item, removeItem, toggleItem }: Props) {
  const handleDelete = useCallback(() => {
    removeItem(item);
  }, [item, removeItem]);

  const handleToggle = useCallback(() => {
    toggleItem(item);
  }, [item, toggleItem]);

  return (
    <li className={styles.ListItem}>
      <button className={styles.IconButton} onClick={handleDelete}>
        🗑
      </button>
      <label className={styles.Label}>
        <input
          className={styles.Input}
          checked={item.isComplete}
          onChange={handleToggle}
          type="checkbox"
        />{' '}
        {item.text}
      </label>
    </li>
  );
}
