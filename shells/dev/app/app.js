// @flow

import React from 'react';
import List from './ToDoList';
import ElementTypes from './ElementTypes';
import styles from './App.css';

export default function App() {
  return (
    <div className={styles.App}>
      <List />
      <ElementTypes />
    </div>
  );
}
