/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Fragment, useCallback, useState} from 'react';

export function ListItem({item, removeItem, toggleItem}) {
  const handleDelete = useCallback(() => {
    removeItem(item);
  }, [item, removeItem]);

  const handleToggle = useCallback(() => {
    toggleItem(item);
  }, [item, toggleItem]);

  return (
    <li>
      <button onClick={handleDelete}>Delete</button>
      <label>
        <input
          checked={item.isComplete}
          onChange={handleToggle}
          type="checkbox"
        />{' '}
        {item.text}
      </label>
    </li>
  );
}

export function List(props) {
  const [newItemText, setNewItemText] = useState('');
  const [items, setItems] = useState([
    {id: 1, isComplete: true, text: 'First'},
    {id: 2, isComplete: true, text: 'Second'},
    {id: 3, isComplete: false, text: 'Third'},
  ]);
  const [uid, setUID] = useState(4);

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
  }, [newItemText, items, uid]);

  const handleKeyPress = useCallback(
    event => {
      if (event.key === 'Enter') {
        handleClick();
      }
    },
    [handleClick],
  );

  const handleChange = useCallback(
    event => {
      setNewItemText(event.currentTarget.value);
    },
    [setNewItemText],
  );

  const removeItem = useCallback(
    itemToRemove => setItems(items.filter(item => item !== itemToRemove)),
    [items],
  );

  const toggleItem = useCallback(
    itemToToggle => {
      // Dont use indexOf()
      // because editing props in DevTools creates a new Object.
      const index = items.findIndex(item => item.id === itemToToggle.id);

      setItems(
        items
          .slice(0, index)
          .concat({
            ...itemToToggle,
            isComplete: !itemToToggle.isComplete,
          })
          .concat(items.slice(index + 1)),
      );
    },
    [items],
  );

  return (
    <Fragment>
      <h1>List</h1>
      <input
        type="text"
        placeholder="New list item..."
        value={newItemText}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
      />
      <button disabled={newItemText === ''} onClick={handleClick}>
        <span role="img" aria-label="Add item">
          Add
        </span>
      </button>
      <ul>
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
