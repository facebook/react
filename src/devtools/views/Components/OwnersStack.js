// @flow
import React, {
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
  createRef,
  forwardRef,
} from 'react';
import classNames from 'classnames';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import { TreeContext } from './TreeContext';
import { StoreContext } from '../context';
import { useIsOverflowing } from '../hooks';

import type { Element } from './types';

import styles from './OwnersStack.css';

type ElementsDropdownProps = {
  selectedElementIndex: number | null,
  children: Array<any>,
};
function ElementsDropdown({
  selectedElementIndex,
  children,
}: ElementsDropdownProps) {
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const handleClick = useCallback(() => {
    setIsDropdownVisible(!isDropdownVisible);
  }, [isDropdownVisible, setIsDropdownVisible]);

  useLayoutEffect(() => {
    setIsDropdownVisible(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElementIndex]);

  return (
    <div className={styles.ElementsDropdown}>
      <Button
        className={classNames(styles.IconButton, {
          [styles.DropdownButtonActive]: isDropdownVisible,
        })}
        onClick={handleClick}
        title="Open elements dropdown"
      >
        <ButtonIcon type="more" />
      </Button>
      {isDropdownVisible && <div className={styles.Dropdown}>{children}</div>}
    </div>
  );
}

type ElementsBarProps = {
  elements: Array<any>,
  showSelectedOnly: boolean,
};
const ElementsBar = forwardRef(
  ({ elements, showSelectedOnly }: ElementsBarProps, ref: Object) => {
    return (
      <div
        className={classNames(styles.ElementsBar, {
          [styles.ElementsBarSelectedOnly]: showSelectedOnly,
        })}
        ref={ref}
      >
        {elements}
      </div>
    );
  }
);

type ElementViewProps = {
  id: number,
  index: number,
};
function ElementView({ id, index }: ElementViewProps) {
  const { ownerStackIndex, selectOwner } = useContext(TreeContext);
  const store = useContext(StoreContext);
  const { displayName } = ((store.getElementByID(id): any): Element);

  const isSelected = ownerStackIndex === index;

  const handleClick = useCallback(() => {
    if (!isSelected) {
      selectOwner(id);
    }
  }, [id, isSelected, selectOwner]);

  return (
    <button
      className={isSelected ? styles.FocusedComponent : styles.Component}
      onClick={handleClick}
    >
      {displayName}
    </button>
  );
}

export default function OwnerStack() {
  const { ownerStack, ownerStackIndex, resetOwnerStack } = useContext(
    TreeContext
  );

  const [elementsTotalWidth, setElementsTotalWidth] = useState(0);
  const elementsBarRef = createRef<HTMLDivElement | null>();
  const isOverflowing = useIsOverflowing(elementsBarRef, elementsTotalWidth);

  const elements = ownerStack.map((id, index) => (
    <ElementView key={id} id={id} index={index} />
  ));

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
      {isOverflowing && (
        <ElementsDropdown selectedElementIndex={ownerStackIndex}>
          {elements}
        </ElementsDropdown>
      )}
      <div className={styles.VRule} />
      <ElementsBar
        elements={elements}
        showSelectedOnly={isOverflowing}
        ref={elementsBarRef}
      />
    </div>
  );
}
