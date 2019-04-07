// @flow
import React, {
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import Toggle from '../Toggle';
import { TreeContext } from './TreeContext';
import { StoreContext } from '../context';
import { useIsOverflowing } from '../hooks';

import type { Element } from './types';

import styles from './OwnersStack.css';

export default function OwnerStack() {
  const { ownerStack, ownerStackIndex, resetOwnerStack } = useContext(
    TreeContext
  );

  const [elementsTotalWidth, setElementsTotalWidth] = useState(0);
  const elementsBarRef = useRef<HTMLDivElement | null>(null);
  const isOverflowing = useIsOverflowing(elementsBarRef, elementsTotalWidth);

  useLayoutEffect(() => {
    if (elementsBarRef.current === null) {
      return () => {};
    }

    let elementsTotalWidth = 0;
    for (let i = 0; i < ownerStack.length; i++) {
      const element = elementsBarRef.current.children[i];
      const computedStyle = getComputedStyle(element);

      elementsTotalWidth +=
        element.offsetWidth +
        parseInt(computedStyle.marginLeft, 10) +
        parseInt(computedStyle.marginRight, 10);
    }

    setElementsTotalWidth(elementsTotalWidth);
  }, [elementsBarRef, ownerStack.length]);

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
      <div className={styles.Bar} ref={elementsBarRef}>
        {isOverflowing && (
          <ElementsDropdown
            ownerStack={ownerStack}
            ownerStackIndex={ownerStackIndex}
          />
        )}
        {isOverflowing ? (
          <ElementView
            id={ownerStack[((ownerStackIndex: any): number)]}
            index={ownerStackIndex}
          />
        ) : (
          ownerStack.map((id, index) => (
            <ElementView key={id} id={id} index={index} />
          ))
        )}
      </div>
    </div>
  );
}

type ElementsDropdownProps = {
  ownerStack: Array<number>,
  ownerStackIndex: number | null,
};
function ElementsDropdown({
  ownerStack,
  ownerStackIndex,
}: ElementsDropdownProps) {
  const store = useContext(StoreContext);
  const { selectOwner } = useContext(TreeContext);

  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const handleDropdownButtonClick = useCallback(() => {
    setIsDropdownVisible(!isDropdownVisible);
  }, [isDropdownVisible, setIsDropdownVisible]);

  const handleElementClick = useCallback(
    (id: number) => {
      selectOwner(id);
      setIsDropdownVisible(false);
    },
    [selectOwner, setIsDropdownVisible]
  );

  return (
    <div className={styles.DropdownWrapper}>
      <Toggle
        className={styles.Toggle}
        isChecked={isDropdownVisible}
        onChange={handleDropdownButtonClick}
        title="Open elements dropdown"
      >
        <ButtonIcon type="more" />
      </Toggle>
      {isDropdownVisible && (
        <div className={styles.Dropdown}>
          {ownerStack.map((id, index) => (
            <button
              className={
                ownerStackIndex === index
                  ? styles.SelectedComponent
                  : styles.Component
              }
              onClick={() => handleElementClick(id)}
            >
              {((store.getElementByID(id): any): Element).displayName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type ElementViewProps = {
  id: number,
  index: number | null,
};
function ElementView({ id, index }: ElementViewProps) {
  const store = useContext(StoreContext);
  const { ownerStackIndex, selectOwner } = useContext(TreeContext);

  const { displayName } = ((store.getElementByID(id): any): Element);

  const isSelected = ownerStackIndex === index;

  const handleClick = useCallback(() => {
    if (!isSelected) {
      selectOwner(id);
    }
  }, [id, isSelected, selectOwner]);

  return (
    <button
      className={isSelected ? styles.SelectedComponent : styles.Component}
      onClick={handleClick}
    >
      {displayName}
    </button>
  );
}
