/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useEffect, useRef, useState} from 'react';
import EditableName from './EditableName';
import EditableValue from './EditableValue';
import NewArrayValue from './NewArrayValue';
import NewKeyValue from './NewKeyValue';
import ExpandCollapseToggle from './ExpandCollapseToggle';
import {alphaSortEntries, getMetaValueLabel} from '../utils';
import {meta} from '../../../hydration';
import useContextMenu from '../../ContextMenu/useContextMenu';
import Store from '../../store';
import {parseHookPathForEdit} from './utils';
import styles from './KeyValue.css';
import Button from 'react-devtools-shared/src/devtools/views/Button';
import ButtonIcon from 'react-devtools-shared/src/devtools/views/ButtonIcon';

import type {InspectedElement} from './types';
import type {Element} from 'react';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type {GetInspectedElementPath} from './InspectedElementContext';

type Type = 'props' | 'state' | 'context' | 'hooks';

type KeyValueProps = {|
  alphaSort: boolean,
  bridge: FrontendBridge,
  canDeletePaths: boolean,
  canEditValues: boolean,
  canRenamePaths: boolean,
  canRenamePathsAtDepth?: (depth: number) => boolean,
  depth: number,
  hidden: boolean,
  hookID?: ?number,
  getInspectedElementPath: GetInspectedElementPath,
  inspectedElement: InspectedElement,
  isDirectChildOfAnArray?: boolean,
  name: string,
  path: Array<any>,
  pathRoot: Type,
  store: Store,
  value: any,
|};

export default function KeyValue({
  alphaSort,
  bridge,
  canDeletePaths,
  canEditValues,
  canRenamePaths,
  canRenamePathsAtDepth,
  depth,
  getInspectedElementPath,
  inspectedElement,
  isDirectChildOfAnArray,
  hidden,
  hookID,
  name,
  path,
  pathRoot,
  store,
  value,
}: KeyValueProps) {
  const {id} = inspectedElement;

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const prevIsOpenRef = useRef(isOpen);
  const contextMenuTriggerRef = useRef(null);

  let isInspectable = false;
  let isReadOnly = false;
  if (value !== null && typeof value === 'object') {
    isInspectable = value[meta.inspectable] && value[meta.size] !== 0;
    isReadOnly = value[meta.readonly];
  }

  useEffect(() => {
    if (isInspectable && isOpen && !prevIsOpenRef.current) {
      getInspectedElementPath(id, [pathRoot, ...path]);
    }
    prevIsOpenRef.current = isOpen;
  }, [getInspectedElementPath, isInspectable, isOpen, path, pathRoot]);

  const toggleIsOpen = () => setIsOpen(prevIsOpen => !prevIsOpen);

  useContextMenu({
    data: {
      path: [pathRoot, ...path],
      type:
        value !== null &&
        typeof value === 'object' &&
        hasOwnProperty.call(value, meta.type)
          ? value[meta.type]
          : typeof value,
    },
    id: 'InspectedElement',
    ref: contextMenuTriggerRef,
  });

  const dataType = typeof value;
  const isSimpleType =
    dataType === 'number' ||
    dataType === 'string' ||
    dataType === 'boolean' ||
    value == null;

  const style = {
    paddingLeft: `${(depth - 1) * 0.75}rem`,
  };

  const overrideValue = (newPath, newValue) => {
    if (hookID != null) {
      newPath = parseHookPathForEdit(newPath);
    }

    const rendererID = store.getRendererIDForElement(id);
    if (rendererID !== null) {
      bridge.send('overrideValueAtPath', {
        hookID,
        id,
        path: newPath,
        rendererID,
        type: pathRoot,
        value: newValue,
      });
    }
  };

  const deletePath = pathToDelete => {
    if (hookID != null) {
      pathToDelete = parseHookPathForEdit(pathToDelete);
    }

    const rendererID = store.getRendererIDForElement(id);
    if (rendererID !== null) {
      bridge.send('deletePath', {
        hookID,
        id,
        path: pathToDelete,
        rendererID,
        type: pathRoot,
      });
    }
  };

  const renamePath = (oldPath, newPath) => {
    if (newPath[newPath.length - 1] === '') {
      // Deleting the key suggests an intent to delete the whole path.
      if (canDeletePaths) {
        deletePath(oldPath);
      }
    } else {
      if (hookID != null) {
        oldPath = parseHookPathForEdit(oldPath);
        newPath = parseHookPathForEdit(newPath);
      }

      const rendererID = store.getRendererIDForElement(id);
      if (rendererID !== null) {
        bridge.send('renamePath', {
          hookID,
          id,
          newPath,
          oldPath,
          rendererID,
          type: pathRoot,
        });
      }
    }
  };

  // TRICKY This is a bit of a hack to account for context and hooks.
  // In these cases, paths can be renamed but only at certain depths.
  // The special "value" wrapper for context shouldn't be editable.
  // Only certain types of hooks should be editable.
  let canRenameTheCurrentPath = canRenamePaths;
  if (canRenameTheCurrentPath && typeof canRenamePathsAtDepth === 'function') {
    canRenameTheCurrentPath = canRenamePathsAtDepth(depth);
  }

  let renderedName;
  if (isDirectChildOfAnArray) {
    if (canDeletePaths) {
      renderedName = (
        <DeleteToggle name={name} deletePath={deletePath} path={path} />
      );
    } else {
      renderedName = <span className={styles.Name}>{name}</span>;
    }
  } else if (canRenameTheCurrentPath) {
    renderedName = (
      <EditableName
        allowEmpty={canDeletePaths}
        className={styles.EditableName}
        initialValue={name}
        overrideName={renamePath}
        path={path}
      />
    );
  } else {
    renderedName = <span className={styles.Name}>{name}</span>;
  }

  let children = null;
  if (isSimpleType) {
    let displayValue = value;
    if (dataType === 'string') {
      displayValue = `"${value}"`;
    } else if (dataType === 'boolean') {
      displayValue = value ? 'true' : 'false';
    } else if (value === null) {
      displayValue = 'null';
    } else if (value === undefined) {
      displayValue = 'undefined';
    }

    children = (
      <div
        key="root"
        className={styles.Item}
        hidden={hidden}
        ref={contextMenuTriggerRef}
        style={style}>
        <div className={styles.ExpandCollapseToggleSpacer} />
        {renderedName}
        <div className={styles.AfterName}>:</div>
        {canEditValues ? (
          <EditableValue
            overrideValue={overrideValue}
            path={path}
            value={value}
          />
        ) : (
          <span className={styles.Value}>{displayValue}</span>
        )}
      </div>
    );
  } else if (
    hasOwnProperty.call(value, meta.type) &&
    !hasOwnProperty.call(value, meta.unserializable)
  ) {
    children = (
      <div
        key="root"
        className={styles.Item}
        hidden={hidden}
        ref={contextMenuTriggerRef}
        style={style}>
        {isInspectable ? (
          <ExpandCollapseToggle isOpen={isOpen} setIsOpen={setIsOpen} />
        ) : (
          <div className={styles.ExpandCollapseToggleSpacer} />
        )}
        {renderedName}
        <div className={styles.AfterName}>:</div>
        <span
          className={styles.Value}
          onClick={isInspectable ? toggleIsOpen : undefined}>
          {getMetaValueLabel(value)}
        </span>
      </div>
    );
  } else {
    if (Array.isArray(value)) {
      const hasChildren = value.length > 0 || canEditValues;
      const displayName = getMetaValueLabel(value);

      children = value.map((innerValue, index) => (
        <KeyValue
          key={index}
          alphaSort={alphaSort}
          bridge={bridge}
          canDeletePaths={canDeletePaths && !isReadOnly}
          canEditValues={canEditValues && !isReadOnly}
          canRenamePaths={canRenamePaths && !isReadOnly}
          canRenamePathsAtDepth={canRenamePathsAtDepth}
          depth={depth + 1}
          getInspectedElementPath={getInspectedElementPath}
          hookID={hookID}
          inspectedElement={inspectedElement}
          isDirectChildOfAnArray={true}
          hidden={hidden || !isOpen}
          name={index}
          path={path.concat(index)}
          pathRoot={pathRoot}
          store={store}
          value={value[index]}
        />
      ));

      if (canEditValues && !isReadOnly) {
        children.push(
          <NewArrayValue
            key="NewKeyValue"
            bridge={bridge}
            depth={depth + 1}
            hidden={hidden || !isOpen}
            hookID={hookID}
            index={value.length}
            getInspectedElementPath={getInspectedElementPath}
            inspectedElement={inspectedElement}
            path={path}
            store={store}
            type={pathRoot}
          />,
        );
      }

      children.unshift(
        <div
          key={`${depth}-root`}
          className={styles.Item}
          hidden={hidden}
          ref={contextMenuTriggerRef}
          style={style}>
          {hasChildren ? (
            <ExpandCollapseToggle isOpen={isOpen} setIsOpen={setIsOpen} />
          ) : (
            <div className={styles.ExpandCollapseToggleSpacer} />
          )}
          {renderedName}
          <div className={styles.AfterName}>:</div>
          <span
            className={styles.Value}
            onClick={hasChildren ? toggleIsOpen : undefined}>
            {displayName}
          </span>
        </div>,
      );
    } else {
      // TRICKY
      // It's important to use Object.entries() rather than Object.keys()
      // because of the hidden meta Symbols used for hydration and unserializable values.
      const entries = Object.entries(value);
      if (alphaSort) {
        entries.sort(alphaSortEntries);
      }

      const hasChildren = entries.length > 0 || canEditValues;
      const displayName = getMetaValueLabel(value);

      children = entries.map<Element<any>>(([key, keyValue]) => (
        <KeyValue
          key={key}
          alphaSort={alphaSort}
          bridge={bridge}
          canDeletePaths={canDeletePaths && !isReadOnly}
          canEditValues={canEditValues && !isReadOnly}
          canRenamePaths={canRenamePaths && !isReadOnly}
          canRenamePathsAtDepth={canRenamePathsAtDepth}
          depth={depth + 1}
          getInspectedElementPath={getInspectedElementPath}
          hookID={hookID}
          inspectedElement={inspectedElement}
          hidden={hidden || !isOpen}
          name={key}
          path={path.concat(key)}
          pathRoot={pathRoot}
          store={store}
          value={keyValue}
        />
      ));

      if (canEditValues && !isReadOnly) {
        children.push(
          <NewKeyValue
            key="NewKeyValue"
            bridge={bridge}
            depth={depth + 1}
            getInspectedElementPath={getInspectedElementPath}
            hidden={hidden || !isOpen}
            hookID={hookID}
            inspectedElement={inspectedElement}
            path={path}
            store={store}
            type={pathRoot}
          />,
        );
      }

      children.unshift(
        <div
          key={`${depth}-root`}
          className={styles.Item}
          hidden={hidden}
          ref={contextMenuTriggerRef}
          style={style}>
          {hasChildren ? (
            <ExpandCollapseToggle isOpen={isOpen} setIsOpen={setIsOpen} />
          ) : (
            <div className={styles.ExpandCollapseToggleSpacer} />
          )}
          {renderedName}
          <div className={styles.AfterName}>:</div>
          <span
            className={styles.Value}
            onClick={hasChildren ? toggleIsOpen : undefined}>
            {displayName}
          </span>
        </div>,
      );
    }
  }

  return children;
}

function DeleteToggle({deletePath, name, path}) {
  const handleClick = event => {
    event.stopPropagation();
    deletePath(path);
  };

  return (
    <>
      <Button
        className={styles.DeleteArrayItemButton}
        onClick={handleClick}
        title="Delete entry">
        <ButtonIcon type="delete" />
      </Button>
      <span className={styles.Name}>{name}</span>
    </>
  );
}
