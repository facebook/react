// @flow
import React, {
  useCallback,
  useContext,
  useEffect,
  useState,
  createRef,
  forwardRef,
} from 'react';
import throttle from 'lodash.throttle';
import classNames from 'classnames';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import { TreeContext } from './TreeContext';
import { StoreContext } from '../context';

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

  useEffect(() => {
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
  const [isElementsBarOverflowing, setIsElementsBarOverflowing] = useState(
    false
  );
  const [elementsTotalWidth, setElementsTotalWidth] = useState(0);
  const elementsBarRef = createRef<HTMLDivElement | null>();
  const elements = ownerStack.map((id, index) => (
    <ElementView key={id} id={id} index={index} />
  ));

  useEffect(() => {
    if (elementsBarRef.current === null) {
      return () => {};
    }
    const elements = Array.from(elementsBarRef.current.children);
    const elementsTotalWidth = elements.reduce((acc, el) => {
      const { offsetWidth } = el;
      const marginRight = parseInt(getComputedStyle(el).marginRight, 10);
      return acc + (offsetWidth + marginRight);
    }, 0);

    setElementsTotalWidth(elementsTotalWidth);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerStackIndex, elementsBarRef]);

  useElementsBarOverflowing(
    elementsBarRef,
    elementsTotalWidth,
    setIsElementsBarOverflowing
  );

  return (
    <div className={styles.OwnerStack}>
      <Button
        className={styles.IconButton}
        onClick={resetOwnerStack}
        title="Back to tree view"
      >
        <ButtonIcon type="close" />
      </Button>
      {isElementsBarOverflowing && (
        <ElementsDropdown selectedElementIndex={ownerStackIndex}>
          {elements}
        </ElementsDropdown>
      )}
      <div className={styles.VRule} />
      <ElementsBar
        elements={elements}
        showSelectedOnly={isElementsBarOverflowing}
        ref={elementsBarRef}
      />
    </div>
  );
}

function useElementsBarOverflowing(
  elementsBarRef: Object,
  elementsTotalWidth: number,
  callback: Function
) {
  useEffect(() => {
    const handleResize = () => {
      let isElementsBarOverflowing = false;
      if (elementsBarRef.current !== null) {
        const elementsBarWidth = elementsBarRef.current.clientWidth;
        isElementsBarOverflowing = elementsBarWidth <= elementsTotalWidth;
      }
      callback(isElementsBarOverflowing);
    };
    const debounceHandleResize = throttle(handleResize, 100);

    handleResize();

    // It's important to listen to the ownerDocument.defaultView to support the browser extension.
    // Here we use portals to render individual tabs (e.g. Profiler),
    // and the root document might belong to a different window.
    const ownerWindow = elementsBarRef.current.ownerDocument.defaultView;
    ownerWindow.addEventListener('resize', debounceHandleResize);
    return () =>
      ownerWindow.removeEventListener('resize', debounceHandleResize);
  }, [elementsBarRef, elementsTotalWidth, callback]);
}
