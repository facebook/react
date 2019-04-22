// @flow
import React, {
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
// TODO (tooltips) import Tooltip from '@reach/tooltip';
import { Menu, MenuList, MenuButton, MenuItem } from '@reach/menu-button';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import Toggle from '../Toggle';
import { TreeDispatcherContext, TreeStateContext } from './TreeContext';
import { StoreContext } from '../context';
import { useIsOverflowing } from '../hooks';

import type { Element } from './types';

import styles from './OwnersStack.css';

export default function OwnerStack() {
  const { ownerStack, ownerStackIndex } = useContext(TreeStateContext);
  const dispatch = useContext(TreeDispatcherContext);

  const [elementsTotalWidth, setElementsTotalWidth] = useState(0);
  const elementsBarRef = useRef<HTMLDivElement | null>(null);
  const isOverflowing = useIsOverflowing(elementsBarRef, elementsTotalWidth);

  useLayoutEffect(() => {
    // If we're already overflowing, then we don't need to re-measure items.
    // That's because once the owners stack is open, it can only get larger (by driling in).
    // A totally new stack can only be reached by exiting this mode and re-entering it.
    if (elementsBarRef.current === null || isOverflowing) {
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
  }, [elementsBarRef, isOverflowing, ownerStack.length]);

  return (
    <div className={styles.OwnerStack}>
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
      <div className={styles.VRule} />
      <Button
        className={styles.IconButton}
        onClick={() => dispatch({ type: 'RESET_OWNER_STACK' })}
        title="Back to tree view"
      >
        <ButtonIcon type="close" />
      </Button>
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
  const dispatch = useContext(TreeDispatcherContext);

  return (
    <Menu>
      {/* TODO (tooltips) <Tooltip label="Open elements dropdown"> */}
      <MenuButton className={styles.MenuButton}>
        <span className={styles.MenuButtonContent} tabIndex={-1}>
          <ButtonIcon type="more" />
        </span>
      </MenuButton>
      {/* TODO (tooltips) </Tooltip> */}
      <MenuList className={styles.Modal}>
        {ownerStack.map((id, index) => (
          <MenuItem
            key={id}
            className={styles.Component}
            onSelect={() => dispatch({ type: 'SELECT_OWNER', payload: id })}
          >
            {((store.getElementByID(id): any): Element).displayName}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
}

type ElementViewProps = {
  id: number,
  index: number | null,
};
function ElementView({ id, index }: ElementViewProps) {
  const store = useContext(StoreContext);
  const { ownerStackIndex } = useContext(TreeStateContext);
  const dispatch = useContext(TreeDispatcherContext);

  const { displayName } = ((store.getElementByID(id): any): Element);

  const isChecked = ownerStackIndex === index;

  const handleChange = useCallback(() => {
    if (!isChecked) {
      dispatch({ type: 'SELECT_OWNER', payload: id });
    }
  }, [dispatch, id, isChecked]);

  return (
    <Toggle
      className={styles.Component}
      isChecked={isChecked}
      onChange={handleChange}
    >
      {displayName}
    </Toggle>
  );
}
