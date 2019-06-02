// @flow
import React, {
  Fragment,
  useCallback,
  useContext,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from 'react';
import Tooltip from '@reach/tooltip';
import { Menu, MenuList, MenuButton, MenuItem } from '@reach/menu-button';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import Toggle from '../Toggle';
import Badge from './Badge';
import { OwnersListContext } from './OwnersListContext';
import { TreeDispatcherContext, TreeStateContext } from './TreeContext';
import { useIsOverflowing } from '../hooks';
import { StoreContext } from '../context';
import { ElementTypeMemo, ElementTypeForwardRef } from 'src/types';

import type { Owner } from './types';

import styles from './OwnersStack.css';

type SelectOwner = (owner: Owner | null) => void;

type ACTION_UPDATE_OWNER_ID = {|
  type: 'UPDATE_OWNER_ID',
  ownerID: number | null,
  owners: Array<Owner>,
|};
type ACTION_UPDATE_SELECTED_INDEX = {|
  type: 'UPDATE_SELECTED_INDEX',
  selectedIndex: number,
|};

type Action = ACTION_UPDATE_OWNER_ID | ACTION_UPDATE_SELECTED_INDEX;

type State = {|
  ownerID: number | null,
  owners: Array<Owner>,
  selectedIndex: number,
|};

function dialogReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_OWNER_ID':
      const selectedIndex = action.owners.findIndex(
        owner => owner.id === action.ownerID
      );
      return {
        ownerID: action.ownerID,
        owners: action.owners,
        selectedIndex,
      };
    case 'UPDATE_SELECTED_INDEX':
      return {
        ...state,
        selectedIndex: action.selectedIndex,
      };
    default:
      throw new Error(`Invalid action "${action.type}"`);
  }
}

export default function OwnerStack() {
  const read = useContext(OwnersListContext);
  const { ownerID } = useContext(TreeStateContext);
  const treeDispatch = useContext(TreeDispatcherContext);

  const [state, dispatch] = useReducer<State, Action>(dialogReducer, {
    ownerID: null,
    owners: [],
    selectedIndex: 0,
  });

  // When an owner is selected, we either need to update the selected index, or we need to fetch a new list of owners.
  // We use a reducer here so that we can avoid fetching a new list unless the owner ID has actually changed.
  if (ownerID === null) {
    dispatch({
      type: 'UPDATE_OWNER_ID',
      ownerID: null,
      owners: [],
    });
  } else if (ownerID !== state.ownerID) {
    const isInStore =
      state.owners.findIndex(owner => owner.id === ownerID) >= 0;
    dispatch({
      type: 'UPDATE_OWNER_ID',
      ownerID,
      owners: isInStore ? state.owners : read(ownerID) || [],
    });
  }

  const { owners, selectedIndex } = state;

  const selectOwner = useCallback<SelectOwner>(
    (owner: Owner | null) => {
      if (owner !== null) {
        const index = owners.indexOf(owner);
        dispatch({
          type: 'UPDATE_SELECTED_INDEX',
          selectedIndex: index >= 0 ? index : 0,
        });
        treeDispatch({ type: 'SELECT_OWNER', payload: owner.id });
      } else {
        dispatch({
          type: 'UPDATE_SELECTED_INDEX',
          selectedIndex: 0,
        });
        treeDispatch({ type: 'RESET_OWNER_STACK' });
      }
    },
    [owners, treeDispatch]
  );

  const [elementsTotalWidth, setElementsTotalWidth] = useState(0);
  const elementsBarRef = useRef<HTMLDivElement | null>(null);
  const isOverflowing = useIsOverflowing(elementsBarRef, elementsTotalWidth);

  const selectedOwner = owners[selectedIndex];

  useLayoutEffect(() => {
    // If we're already overflowing, then we don't need to re-measure items.
    // That's because once the owners stack is open, it can only get larger (by driling in).
    // A totally new stack can only be reached by exiting this mode and re-entering it.
    if (elementsBarRef.current === null || isOverflowing) {
      return () => {};
    }

    let elementsTotalWidth = 0;
    for (let i = 0; i < owners.length; i++) {
      const element = elementsBarRef.current.children[i];
      const computedStyle = getComputedStyle(element);

      elementsTotalWidth +=
        element.offsetWidth +
        parseInt(computedStyle.marginLeft, 10) +
        parseInt(computedStyle.marginRight, 10);
    }

    setElementsTotalWidth(elementsTotalWidth);
  }, [elementsBarRef, isOverflowing, owners.length]);

  return (
    <div className={styles.OwnerStack}>
      <div className={styles.Bar} ref={elementsBarRef}>
        {isOverflowing && (
          <Fragment>
            <ElementsDropdown
              owners={owners}
              selectedIndex={selectedIndex}
              selectOwner={selectOwner}
            />
            <BackToOwnerButton
              owners={owners}
              selectedIndex={selectedIndex}
              selectOwner={selectOwner}
            />
            {selectedOwner != null && (
              <ElementView
                owner={selectedOwner}
                isSelected
                selectOwner={selectOwner}
              />
            )}
          </Fragment>
        )}
        {!isOverflowing &&
          owners.map((owner, index) => (
            <ElementView
              key={index}
              owner={owner}
              isSelected={index === selectedIndex}
              selectOwner={selectOwner}
            />
          ))}
      </div>
      <div className={styles.VRule} />
      <Button
        className={styles.IconButton}
        onClick={() => selectOwner(null)}
        title="Back to tree view"
      >
        <ButtonIcon type="close" />
      </Button>
    </div>
  );
}

type ElementsDropdownProps = {
  owners: Array<Owner>,
  selectedIndex: number,
  selectOwner: SelectOwner,
};
function ElementsDropdown({
  owners,
  selectedIndex,
  selectOwner,
}: ElementsDropdownProps) {
  const store = useContext(StoreContext);

  const menuItems = [];
  for (let index = owners.length - 1; index >= 0; index--) {
    const owner = owners[index];
    const isInStore = store.containsElement(owner.id);
    menuItems.push(
      <MenuItem
        key={owner.id}
        className={`${styles.Component} ${isInStore ? '' : styles.NotInStore}`}
        onSelect={() => (isInStore ? selectOwner(owner) : null)}
      >
        {owner.displayName}
      </MenuItem>
    );
  }

  return (
    <Menu>
      <MenuButton className={styles.MenuButton}>
        <Tooltip label="Open elements dropdown">
          <span className={styles.MenuButtonContent} tabIndex={-1}>
            <ButtonIcon type="more" />
          </span>
        </Tooltip>
      </MenuButton>
      <MenuList className={styles.Modal}>{menuItems}</MenuList>
    </Menu>
  );
}

type ElementViewProps = {
  isSelected: boolean,
  owner: Owner,
  selectOwner: SelectOwner,
};
function ElementView({ isSelected, owner, selectOwner }: ElementViewProps) {
  const store = useContext(StoreContext);

  const { displayName, hocDisplayNames, type } = owner;
  const isInStore = store.containsElement(owner.id);

  const handleChange = useCallback(() => {
    if (isInStore) {
      selectOwner(owner);
    }
  }, [isInStore, selectOwner, owner]);

  // TODO Maybe factor this into a shared util method?
  let badge = null;
  if (hocDisplayNames !== null) {
    badge = hocDisplayNames.length === 1 ? hocDisplayNames[0] : '…';
  } else if (type === ElementTypeMemo) {
    badge = 'Memo';
  } else if (type === ElementTypeForwardRef) {
    badge = 'ForwardRef';
  }

  return (
    <Toggle
      className={`${styles.Component} ${isInStore ? '' : styles.NotInStore}`}
      isChecked={isSelected}
      onChange={handleChange}
    >
      {displayName}

      <Badge className={styles.Badge}>{badge}</Badge>
    </Toggle>
  );
}

type BackToOwnerButtonProps = {|
  owners: Array<Owner>,
  selectedIndex: number,
  selectOwner: SelectOwner,
|};
function BackToOwnerButton({
  owners,
  selectedIndex,
  selectOwner,
}: BackToOwnerButtonProps) {
  const store = useContext(StoreContext);

  if (selectedIndex <= 0) {
    return null;
  }

  const owner = owners[selectedIndex - 1];
  if (owner == null) {
    debugger;
  }
  const isInStore = store.containsElement(owner.id);

  return (
    <Button
      className={isInStore ? undefined : styles.NotInStore}
      onClick={() => (isInStore ? selectOwner(owner) : null)}
      title={`Up to ${owner.displayName || 'owner'}`}
    >
      <ButtonIcon type="previous" />
    </Button>
  );
}
