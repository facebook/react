// @flow

import React, { useCallback, useContext } from 'react';
import ButtonIcon from './ButtonIcon';
import { SearchAndSelectionContext } from './SearchAndSelectionContext';
import { TreeContext } from './context';

import type { Element } from '../types';

import styles from './OwnersStack.css';

export default function OwnerStack() {
  const { clearOwnerList, ownerIDStack } = useContext(
    SearchAndSelectionContext
  );

  // $FlowFixMe "Missing type annotation for U" whatever that means
  const elements = ownerIDStack.map(id => <ElementView key={id} id={id} />);

  return (
    <div className={styles.OwnerStack}>
      <button
        className={styles.IconButton}
        onClick={clearOwnerList}
        title="Back to tree view"
      >
        <ButtonIcon type="back" />
      </button>
      <div className={styles.VRule} />
      {elements}
    </div>
  );
}

type Props = {
  id: number,
};

function ElementView({ id }: Props) {
  const { ownerIDStack, popToOwnerList } = useContext(
    SearchAndSelectionContext
  );
  const { store } = useContext(TreeContext);
  const { displayName } = ((store.getElementByID(id): any): Element);

  const isCurrentlyFocusedOwner = ownerIDStack[ownerIDStack.length - 1] === id;

  const handleClick = useCallback(() => popToOwnerList(id), [
    id,
    popToOwnerList,
  ]);

  return (
    <span
      className={
        isCurrentlyFocusedOwner ? styles.FocusedComponent : styles.Component
      }
      onClick={handleClick}
    >
      {displayName}
    </span>
  );
}
