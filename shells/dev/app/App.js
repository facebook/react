// @flow

import React from 'react';
import ElementTypes from './ElementTypes';
import InspectableElements from './InspectableElements';
import List from './ToDoList';
import styles from './App.css';

export default function App() {
  return (
    <div className={styles.App}>
      <List />
      <ElementTypes />
      <InspectableElements />
    </div>
  );
}
