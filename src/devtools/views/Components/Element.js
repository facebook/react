// @flow

import React, {
  Fragment,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ElementTypeClass, ElementTypeFunction } from 'src/devtools/types';
import Store from 'src/devtools/store';
import ButtonIcon from '../ButtonIcon';
import { createRegExp } from '../utils';
import { TreeContext } from './TreeContext';
import { StoreContext } from '../context';

import type { ItemData } from './Tree';
import type { Element } from './types';

import styles from './Element.css';

type Props = {
  data: ItemData,
  index: number,
  style: Object,
};

export default function ElementView({ data, index, style }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const {
    baseDepth,
    getElementAtIndex,
    ownerStack,
    selectOwner,
    selectedElementID,
    selectElementByID,
  } = useContext(TreeContext);
  const store = useContext(StoreContext);

  const element = getElementAtIndex(index);

  const {
    lastScrolledIDRef,
    treeFocused,
    isNavigatingWithKeyboard,
    onElementMouseEnter,
  } = data;
  const id = element === null ? null : element.id;
  const isSelected = selectedElementID === id;

  const handleDoubleClick = useCallback(() => {
    if (id !== null) {
      selectOwner(id);
    }
  }, [id, selectOwner]);

  const ref = useRef<HTMLSpanElement | null>(null);

  // The tree above has its own autoscrolling, but it only works for rows.
  // However, even when the row gets into the viewport, the component name
  // might be too far left or right on the screen. Adjust it in this case.
  useLayoutEffect(() => {
    if (isSelected) {
      // Don't select the same item twice.
      // A row may appear and disappear just by scrolling:
      // https://github.com/bvaughn/react-devtools-experimental/issues/67
      // It doesn't necessarily indicate a user action.
      // TODO: we might want to revamp the autoscroll logic
      // to only happen explicitly for user-initiated events.
      if (lastScrolledIDRef.current === id) {
        return;
      }
      lastScrolledIDRef.current = id;

      if (ref.current !== null) {
        ref.current.scrollIntoView({
          behavior: 'auto',
          block: 'nearest',
          inline: 'nearest',
        });
      }
    }
  }, [id, isSelected, lastScrolledIDRef]);

  const handleMouseDown = useCallback(
    ({ metaKey }) => {
      if (id !== null) {
        selectElementByID(metaKey ? null : id);
      }
    },
    [id, selectElementByID]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (id !== null) {
      onElementMouseEnter(id);
    }
  }, [onElementMouseEnter, id]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  // Handle elements that are removed from the tree while an async render is in progress.
  if (element == null) {
    console.warn(`<ElementView> Could not find element at index ${index}`);

    // This return needs to happen after hooks, since hooks can't be conditional.
    return null;
  }

  const { depth, displayName, key, type } = ((element: any): Element);

  const showDollarR =
    isSelected && (type === ElementTypeClass || type === ElementTypeFunction);

  let className = styles.Element;
  if (isSelected) {
    className = treeFocused
      ? styles.SelectedElement
      : styles.InactiveSelectedElement;
  } else if (isHovered && !isNavigatingWithKeyboard) {
    className = styles.HoveredElement;
  }

  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      style={{
        ...style, // "style" comes from react-window

        // Left padding presents the appearance of a nested tree structure.
        paddingLeft: `${(depth - baseDepth) * 0.75 + 0.25}rem`,

        // These style overrides enable the background color to fill the full visible width,
        // when combined with the CSS tweaks in Tree.
        // A lot of options were considered; this seemed the one that requires the least code.
        // See https://github.com/bvaughn/react-devtools-experimental/issues/9
        width: undefined,
        minWidth: '100%',
        position: 'relative',
        marginBottom: `-${style.height}px`,
      }}
    >
      {ownerStack.length === 0 ? (
        <ExpandCollapseToggle element={element} store={store} />
      ) : null}
      <span className={styles.Component} ref={ref}>
        <DisplayName displayName={displayName} id={((id: any): number)} />
        {key && (
          <Fragment>
            &nbsp;<span className={styles.AttributeName}>key</span>=
            <span className={styles.AttributeValue}>"{key}"</span>
          </Fragment>
        )}
      </span>
      {showDollarR && <span className={styles.DollarR}>&nbsp;== $r</span>}
    </div>
  );
}

// Prevent double clicks on toggle from drilling into the owner list.
const swallowDoubleClick = event => {
  event.preventDefault();
  event.stopPropagation();
};

type ExpandCollapseToggleProps = {|
  element: Element,
  store: Store,
|};

function ExpandCollapseToggle({ element, store }: ExpandCollapseToggleProps) {
  const { children, id, isCollapsed } = element;

  const toggleCollapsed = useCallback(
    event => {
      event.preventDefault();
      event.stopPropagation();

      store.toggleIsCollapsed(id, !isCollapsed);
    },
    [id, isCollapsed, store]
  );

  const stopPropagation = useCallback(event => {
    // Prevent the row from selecting
    event.stopPropagation();
  }, []);

  if (children.length === 0) {
    return <div className={styles.ExpandCollapseToggle} />;
  }

  return (
    <div
      className={styles.ExpandCollapseToggle}
      onMouseDown={stopPropagation}
      onClick={toggleCollapsed}
      onDoubleClick={swallowDoubleClick}
    >
      <ButtonIcon type={isCollapsed ? 'collapsed' : 'expanded'} />
    </div>
  );
}

type DisplayNameProps = {|
  displayName: string | null,
  id: number,
|};

function DisplayName({ displayName, id }: DisplayNameProps) {
  const { searchIndex, searchResults, searchText } = useContext(TreeContext);
  const isSearchResult = useMemo(() => {
    return searchResults.includes(id);
  }, [id, searchResults]);
  const isCurrentResult =
    searchIndex !== null && id === searchResults[searchIndex];

  if (!isSearchResult || displayName === null) {
    return displayName;
  }

  const match = createRegExp(searchText).exec(displayName);

  if (match === null) {
    return displayName;
  }

  const startIndex = match.index;
  const stopIndex = startIndex + match[0].length;

  const children = [];
  if (startIndex > 0) {
    children.push(<span key="begin">{displayName.slice(0, startIndex)}</span>);
  }
  children.push(
    <mark
      key="middle"
      className={isCurrentResult ? styles.CurrentHighlight : styles.Highlight}
    >
      {displayName.slice(startIndex, stopIndex)}
    </mark>
  );
  if (stopIndex < displayName.length) {
    children.push(<span key="end">{displayName.slice(stopIndex)}</span>);
  }

  return children;
}
