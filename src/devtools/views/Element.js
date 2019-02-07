// @flow

import React, { Fragment, useCallback, useContext, useMemo } from 'react';
import { ElementTypeClassOrFunction } from 'src/devtools/types';
import { TreeContext } from './context';
import { createRegExp } from './utils';
import { SearchAndSelectionContext } from './SearchAndSelectionContext';
import Icon from './Icon';

import styles from './Element.css';

type Props = {
  index: number,
  style: Object,
};

export default function Element({ index, style }: Props) {
  const { store } = useContext(TreeContext);
  const element = store.getElementAtIndex(index);

  // DevTools are rendered in concurrent mode.
  // It's possible the store has updated since the commit that triggered this render.
  // So we need to guard against an undefined element.
  // TODO: Handle this by switching to a Suspense based approach.
  if (element == null) {
    return null;
  }

  // TODO Add click and key handlers for toggling element open/close state.

  const { children, depth, displayName, id, key, type } = element;

  const { selectedElementID, selectElementWithID } = useContext(
    SearchAndSelectionContext
  );
  const handleClick = useCallback(
    ({ metaKey }) => selectElementWithID(metaKey ? null : id),
    [id]
  );

  const isSelected = selectedElementID === id;
  const showDollarR = isSelected && type === ElementTypeClassOrFunction;

  return (
    <div
      className={isSelected ? styles.SelectedElement : styles.Element}
      onClick={handleClick}
      style={{
        ...style, // "style" comes from react-window
        paddingLeft: `${1 + depth}rem`,
      }}
    >
      {children.length > 0 && (
        <span className={styles.ArrowOpen}>
          <Icon type="arrow" />
        </span>
      )}

      <span className={styles.Component}>
        <DisplayName displayName={displayName} id={id} />
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
  const { searchIndex, searchResults, searchText } = useContext(
    SearchAndSelectionContext
  );
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
