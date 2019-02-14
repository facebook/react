// @flow

import React, { useCallback, useContext } from 'react';
import Button from './Button';
import ButtonIcon from './ButtonIcon';
import { TreeContext } from './TreeContext';
import { StoreContext } from './context';

import type { Element } from '../types';

import styles from './OwnersStack.css';

export default function OwnerStack() {
  const { ownerStack, resetOwnerStack } = useContext(TreeContext);

  // $FlowFixMe "Missing type annotation for U" whatever that means
  const elements = ownerStack.map((id, index) => (
    <ElementView key={id} id={id} index={index} />
  ));

  return (
    <div className={styles.OwnerStack}>
      <Button
        className={styles.IconButton}
        onClick={resetOwnerStack}
        title="Back to tree view"
      >
        <ButtonIcon type="close" />
      </Button>
      <div className={styles.VRule} />
      {elements}
    </div>
  );
}

type Props = {
  id: number,
  index: number,
};

function ElementView({ id, index }: Props) {
  const { ownerStackIndex, selectOwner } = useContext(TreeContext);
  const store = useContext(StoreContext);
  const { displayName } = ((store.getElementByID(id): any): Element);

  const isCurrentlyFocusedOwner = ownerStackIndex === index;

  const handleClick = useCallback(() => {
    if (!isCurrentlyFocusedOwner) {
      selectOwner(id);
    }
  }, [id, isCurrentlyFocusedOwner, selectOwner]);

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
