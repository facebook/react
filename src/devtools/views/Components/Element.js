// @flow

import React, {
  Fragment,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import { ElementTypeClass, ElementTypeFunction } from 'src/devtools/types';
import { createRegExp } from '../utils';
import { TreeContext } from './TreeContext';
import { BridgeContext, StoreContext } from '../context';

import type { Element } from './types';

import styles from './Element.css';

type Props = {
  index: number,
  style: Object,
  // TODO: I can't get the correct type to work here:
  data: Object,
};

export default function ElementView({ index, style, data }: Props) {
  const {
    baseDepth,
    getElementAtIndex,
    selectOwner,
    selectedElementID,
    selectElementByID,
  } = useContext(TreeContext);
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  const element = getElementAtIndex(index);

  const id = element === null ? null : element.id;
  const isSelected = selectedElementID === id;
  const lastScrolledIDRef = data.lastScrolledIDRef;

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

  // TODO Add click and key handlers for toggling element open/close state.

  const handleMouseDown = useCallback(
    ({ metaKey }) => {
      if (id !== null) {
        selectElementByID(metaKey ? null : id);
      }
    },
    [id, selectElementByID]
  );

  const rendererID = store.getRendererIDForElement(element.id) || null;
  // Individual elements don't have a corresponding leave handler.
  // Instead, it's implemented on the tree level.
  const handleMouseEnter = useCallback(() => {
    if (rendererID !== null) {
      bridge.send('highlightElementInDOM', {
        displayName: element.displayName,
        id: element.id,
        rendererID,
        scrollIntoView: false,
        isSticky: true,
      });
    }
  }, [bridge, element, rendererID]);

  // Handle elements that are removed from the tree while an async render is in progress.
  if (element == null) {
    console.warn(`<ElementView> Could not find element at index ${index}`);

    // This return needs to happen after hooks, since hooks can't be conditional.
    return null;
  }

  const { depth, displayName, key, type } = ((element: any): Element);

  const showDollarR =
    isSelected && (type === ElementTypeClass || type === ElementTypeFunction);

  // TODO styles.SelectedElement is 100% width but it doesn't take horizontal overflow into account.

  return (
    <div
      className={isSelected ? styles.SelectedElement : styles.Element}
      onMouseEnter={handleMouseEnter}
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
