// @flow

import React, { Fragment, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { ElementTypeClass, ElementTypeFunction } from 'src/devtools/types';
import { createRegExp } from './utils';
import { TreeContext } from './TreeContext';

import type { Element } from '../types';

import styles from './Element.css';

type Props = {
  index: number,
  style: Object,
};

export default function ElementView({ index, style }: Props) {
  const {
    baseDepth,
    getElementAtIndex,
    selectOwner,
    selectedElementID,
    selectElementByID,
  } = useContext(TreeContext);

  const element = getElementAtIndex(index);

  const id = element === null ? null : element.id;

  const handleDoubleClick = useCallback(() => {
    if (id !== null) {
      selectOwner(id);
    }
  }, [id, selectOwner]);

  const ref = useRef();

  useEffect(() => {
    if (isSelected) {
      if (ref.current !== null) {
        ref.current.scrollIntoView();
      }
    }
  }, [isSelected]);

  // TODO Add click and key handlers for toggling element open/close state.

  const handleClick = useCallback(
    ({ metaKey }) => {
      if (id !== null) {
        selectElementByID(metaKey ? null : id);
      }
    },
    [id, selectElementByID]
  );

  // Handle elements that are removed from the tree while an async render is in progress.
  if (element == null) {
    console.warn(`<ElementView> Could not find element at index ${index}`);

    // This return needs to happen after hooks, since hooks can't be conditional.
    return null;
  }

  const { depth, displayName, key, type } = ((element: any): Element);

  const isSelected = selectedElementID === id;
  const showDollarR =
    isSelected && (type === ElementTypeClass || type === ElementTypeFunction);

  // TODO styles.SelectedElement is 100% width but it doesn't take horizontal overflow into account.

  return (
    <div
      className={isSelected ? styles.SelectedElement : styles.Element}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        ...style, // "style" comes from react-window
        paddingLeft: `${(depth - baseDepth) * 0.75 + 0.25}rem`,
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
