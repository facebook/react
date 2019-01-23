// @flow

import React, { Fragment, useCallback, useState } from 'react';
import ListItem from './ListItem';
import styles from './List.css';

export type Item = {|
  id: number,
  isComplete: boolean,
  text: string,
|};

type Props = {||};

export default function List(props: Props) {
  const [newItemText, setNewItemText] = useState<string>('');
  const [items, setItems] = useState<Array<Item>>([
    { id: 1, isComplete: true, text: 'First' },
    { id: 2, isComplete: true, text: 'Second' },
    { id: 3, isComplete: false, text: 'Third' },
  ]);
  const [uid, setUID] = useState<number>(4);

  const handleClick = useCallback(() => {
    if (newItemText !== '') {
      setItems([
        ...items,
        {
          id: uid,
          isComplete: false,
          text: newItemText,
        },
      ]);
      setUID(uid + 1);
      setNewItemText('');
    }
  }, [newItemText]);

  const handleKeyPress = useCallback(
    event => {
      if (event.key === 'Enter') {
        handleClick();
      }
    },
    [handleClick]
  );

  const handleChange = useCallback(
    event => {
      setNewItemText(event.currentTarget.value);
    },
    [setNewItemText]
  );

  const removeItem = useCallback(
    itemToRemove => {
      setItems(items.filter(item => item !== itemToRemove));
    },
    [items]
  );

  const toggleItem = useCallback(
    itemToToggle => {
      const index = items.indexOf(itemToToggle);

      setItems(
        items
          .slice(0, index)
          .concat({
            ...itemToToggle,
            isComplete: !itemToToggle.isComplete,
          })
          .concat(items.slice(index + 1))
      );
    },
    [items]
  );

  return (
    <Fragment>
      <div className={styles.Header}>List</div>
      <input
        type="text"
        placeholder="New list item..."
        className={styles.Input}
        value={newItemText}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
      />
      <button
        className={styles.IconButton}
        disabled={newItemText === ''}
        onClick={handleClick}
      >
        <span role="img" aria-label="Add item">
          ➕
        </span>
      </button>
      <ul className={styles.List}>
        {items.map(item => (
          <ListItem
            key={item.id}
            item={item}
            removeItem={removeItem}
            toggleItem={toggleItem}
          />
        ))}
      </ul>
    </Fragment>
  );
}
