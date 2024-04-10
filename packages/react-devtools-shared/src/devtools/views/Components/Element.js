/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {Fragment, useContext, useMemo, useState} from 'react';
import Store from 'react-devtools-shared/src/devtools/store';
import ButtonIcon from '../ButtonIcon';
import {TreeDispatcherContext, TreeStateContext} from './TreeContext';
import {SettingsContext} from '../Settings/SettingsContext';
import {StoreContext} from '../context';
import {useSubscription} from '../hooks';
import {logEvent} from 'react-devtools-shared/src/Logger';
import IndexableElementBadges from './IndexableElementBadges';
import IndexableDisplayName from './IndexableDisplayName';

import type {ItemData} from './Tree';
import type {Element as ElementType} from 'react-devtools-shared/src/frontend/types';

import styles from './Element.css';
import Icon from '../Icon';

type Props = {
  data: ItemData,
  index: number,
  style: Object,
  ...
};

export default function Element({data, index, style}: Props): React.Node {
  const store = useContext(StoreContext);
  const {ownerFlatTree, ownerID, selectedElementID} =
    useContext(TreeStateContext);
  const dispatch = useContext(TreeDispatcherContext);
  const {showInlineWarningsAndErrors} = React.useContext(SettingsContext);

  const element =
    ownerFlatTree !== null
      ? ownerFlatTree[index]
      : store.getElementAtIndex(index);

  const [isHovered, setIsHovered] = useState(false);

  const {isNavigatingWithKeyboard, onElementMouseEnter, treeFocused} = data;
  const id = element === null ? null : element.id;
  const isSelected = selectedElementID === id;

  const errorsAndWarningsSubscription = useMemo(
    () => ({
      getCurrentValue: () =>
        element === null
          ? {errorCount: 0, warningCount: 0}
          : store.getErrorAndWarningCountForElementID(element.id),
      subscribe: (callback: Function) => {
        store.addListener('mutated', callback);
        return () => store.removeListener('mutated', callback);
      },
    }),
    [store, element],
  );
  const {errorCount, warningCount} = useSubscription<{
    errorCount: number,
    warningCount: number,
  }>(errorsAndWarningsSubscription);

  const handleDoubleClick = () => {
    if (id !== null) {
      dispatch({type: 'SELECT_OWNER', payload: id});
    }
  };

  // $FlowFixMe[missing-local-annot]
  const handleClick = ({metaKey}) => {
    if (id !== null) {
      logEvent({
        event_name: 'select-element',
        metadata: {source: 'click-element'},
      });
      dispatch({
        type: 'SELECT_ELEMENT_BY_ID',
        payload: metaKey ? null : id,
      });
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (id !== null) {
      onElementMouseEnter(id);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  // $FlowFixMe[missing-local-annot]
  const handleKeyDoubleClick = event => {
    // Double clicks on key value are used for text selection (if the text has been truncated).
    // They should not enter the owners tree view.
    event.stopPropagation();
    event.preventDefault();
  };

  // Handle elements that are removed from the tree while an async render is in progress.
  if (element == null) {
    console.warn(`<Element> Could not find element at index ${index}`);

    // This return needs to happen after hooks, since hooks can't be conditional.
    return null;
  }

  const {
    depth,
    displayName,
    hocDisplayNames,
    isStrictModeNonCompliant,
    key,
    compiledWithForget,
  } = element;

  // Only show strict mode non-compliance badges for top level elements.
  // Showing an inline badge for every element in the tree would be noisy.
  const showStrictModeBadge = isStrictModeNonCompliant && depth === 0;

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
      onMouseDown={handleClick}
      onDoubleClick={handleDoubleClick}
      style={style}
      data-testname="ComponentTreeListItem"
      data-depth={depth}>
      {/* This wrapper is used by Tree for measurement purposes. */}
      <div
        className={styles.Wrapper}
        style={{
          // Left offset presents the appearance of a nested tree structure.
          // We must use padding rather than margin/left because of the selected background color.
          transform: `translateX(calc(${depth} * var(--indentation-size)))`,
        }}>
        {ownerID === null && (
          <ExpandCollapseToggle element={element} store={store} />
        )}

        <IndexableDisplayName displayName={displayName} id={id} />

        {key && (
          <Fragment>
            &nbsp;<span className={styles.KeyName}>key</span>="
            <span
              className={styles.KeyValue}
              title={key}
              onDoubleClick={handleKeyDoubleClick}>
              {key}
            </span>
            "
          </Fragment>
        )}

        <IndexableElementBadges
          hocDisplayNames={hocDisplayNames}
          compiledWithForget={compiledWithForget}
          elementID={id}
          className={styles.BadgesBlock}
        />

        {showInlineWarningsAndErrors && errorCount > 0 && (
          <Icon
            type="error"
            className={
              isSelected && treeFocused
                ? styles.ErrorIconContrast
                : styles.ErrorIcon
            }
          />
        )}
        {showInlineWarningsAndErrors && warningCount > 0 && (
          <Icon
            type="warning"
            className={
              isSelected && treeFocused
                ? styles.WarningIconContrast
                : styles.WarningIcon
            }
          />
        )}
        {showStrictModeBadge && (
          <Icon
            className={
              isSelected && treeFocused
                ? styles.StrictModeContrast
                : styles.StrictMode
            }
            title="This component is not running in StrictMode."
            type="strict-mode-non-compliant"
          />
        )}
      </div>
    </div>
  );
}

// Prevent double clicks on toggle from drilling into the owner list.
// $FlowFixMe[missing-local-annot]
const swallowDoubleClick = event => {
  event.preventDefault();
  event.stopPropagation();
};

type ExpandCollapseToggleProps = {
  element: ElementType,
  store: Store,
};

function ExpandCollapseToggle({element, store}: ExpandCollapseToggleProps) {
  const {children, id, isCollapsed} = element;

  // $FlowFixMe[missing-local-annot]
  const toggleCollapsed = event => {
    event.preventDefault();
    event.stopPropagation();

    store.toggleIsCollapsed(id, !isCollapsed);
  };

  // $FlowFixMe[missing-local-annot]
  const stopPropagation = event => {
    // Prevent the row from selecting
    event.stopPropagation();
  };

  if (children.length === 0) {
    return <div className={styles.ExpandCollapseToggle} />;
  }

  return (
    <div
      className={styles.ExpandCollapseToggle}
      onMouseDown={stopPropagation}
      onClick={toggleCollapsed}
      onDoubleClick={swallowDoubleClick}>
      <ButtonIcon type={isCollapsed ? 'collapsed' : 'expanded'} />
    </div>
  );
}
