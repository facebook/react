/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useTransition, useContext, useRef, useState} from 'react';
import {OptionsContext} from '../context';
import EditableName from './EditableName';
import EditableValue from './EditableValue';
import NewArrayValue from './NewArrayValue';
import NewKeyValue from './NewKeyValue';
import LoadingAnimation from './LoadingAnimation';
import ExpandCollapseToggle from './ExpandCollapseToggle';
import {alphaSortEntries, getMetaValueLabel} from '../utils';
import {meta} from '../../../hydration';
import useContextMenu from '../../ContextMenu/useContextMenu';
import Store from '../../store';
import {parseHookPathForEdit} from './utils';
import styles from './KeyValue.css';
import Button from 'react-devtools-shared/src/devtools/views/Button';
import ButtonIcon from 'react-devtools-shared/src/devtools/views/ButtonIcon';
import isArray from 'react-devtools-shared/src/isArray';
import {InspectedElementContext} from './InspectedElementContext';
import {PROTOCOLS_SUPPORTED_AS_LINKS_IN_KEY_VALUE} from './constants';

import type {InspectedElement} from './types';
import type {Element} from 'react-devtools-shared/src/devtools/views/Components/types';
import type {Element as ReactElement} from 'react';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';

type Type = 'props' | 'state' | 'context' | 'hooks';

type KeyValueProps = {|
  alphaSort: boolean,
  bridge: FrontendBridge,
  canDeletePaths: boolean,
  canEditValues: boolean,
  canRenamePaths: boolean,
  canRenamePathsAtDepth?: (depth: number) => boolean,
  depth: number,
  element: Element,
  hidden: boolean,
  hookID?: ?number,
  hookName?: ?string,
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
  element,
  inspectedElement,
  isDirectChildOfAnArray,
  hidden,
  hookID,
  hookName,
  name,
  path,
  pathRoot,
  store,
  value,
}: KeyValueProps) {
  const {readOnly: readOnlyGlobalFlag} = useContext(OptionsContext);
  canDeletePaths = !readOnlyGlobalFlag && canDeletePaths;
  canEditValues = !readOnlyGlobalFlag && canEditValues;
  canRenamePaths = !readOnlyGlobalFlag && canRenamePaths;

  const {id} = inspectedElement;

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const contextMenuTriggerRef = useRef(null);

  const {inspectPaths} = useContext(InspectedElementContext);

  let isInspectable = false;
  let isReadOnlyBasedOnMetadata = false;
  if (value !== null && typeof value === 'object') {
    isInspectable = value[meta.inspectable] && value[meta.size] !== 0;
    isReadOnlyBasedOnMetadata = value[meta.readonly];
  }

  const [isInspectPathsPending, startInspectPathsTransition] = useTransition();
  const toggleIsOpen = () => {
    if (isOpen) {
      setIsOpen(false);
    } else {
      setIsOpen(true);

      if (isInspectable) {
        startInspectPathsTransition(() => {
          inspectPaths([pathRoot, ...path]);
        });
      }
    }
  };

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
      renderedName = (
        <span className={styles.Name}>
          {name}
          {!!hookName && <span className={styles.HookName}>({hookName})</span>}
        </span>
      );
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
    renderedName = (
      <span className={styles.Name}>
        {name}
        {!!hookName && <span className={styles.HookName}>({hookName})</span>}
      </span>
    );
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

    let shouldDisplayValueAsLink = false;
    if (
      dataType === 'string' &&
      PROTOCOLS_SUPPORTED_AS_LINKS_IN_KEY_VALUE.some(protocolPrefix =>
        value.startsWith(protocolPrefix),
      )
    ) {
      shouldDisplayValueAsLink = true;
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
        ) : shouldDisplayValueAsLink ? (
          <a
            className={styles.Link}
            href={value}
            target="_blank"
            rel="noopener noreferrer">
            {displayValue}
          </a>
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
          <ExpandCollapseToggle isOpen={isOpen} setIsOpen={toggleIsOpen} />
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

    if (isInspectPathsPending) {
      children = (
        <>
          {children}
          <div className={styles.Item} style={style}>
            <div className={styles.ExpandCollapseToggleSpacer} />
            <LoadingAnimation />
          </div>
        </>
      );
    }
  } else {
    if (isArray(value)) {
      const hasChildren = value.length > 0 || canEditValues;
      const displayName = getMetaValueLabel(value);

      children = value.map((innerValue, index) => (
        <KeyValue
          key={index}
          alphaSort={alphaSort}
          bridge={bridge}
          canDeletePaths={canDeletePaths && !isReadOnlyBasedOnMetadata}
          canEditValues={canEditValues && !isReadOnlyBasedOnMetadata}
          canRenamePaths={canRenamePaths && !isReadOnlyBasedOnMetadata}
          canRenamePathsAtDepth={canRenamePathsAtDepth}
          depth={depth + 1}
          element={element}
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

      if (canEditValues && !isReadOnlyBasedOnMetadata) {
        children.push(
          <NewArrayValue
            key="NewKeyValue"
            bridge={bridge}
            depth={depth + 1}
            hidden={hidden || !isOpen}
            hookID={hookID}
            index={value.length}
            element={element}
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

      children = entries.map<ReactElement<any>>(([key, keyValue]) => (
        <KeyValue
          key={key}
          alphaSort={alphaSort}
          bridge={bridge}
          canDeletePaths={canDeletePaths && !isReadOnlyBasedOnMetadata}
          canEditValues={canEditValues && !isReadOnlyBasedOnMetadata}
          canRenamePaths={canRenamePaths && !isReadOnlyBasedOnMetadata}
          canRenamePathsAtDepth={canRenamePathsAtDepth}
          depth={depth + 1}
          element={element}
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

      if (canEditValues && !isReadOnlyBasedOnMetadata) {
        children.push(
          <NewKeyValue
            key="NewKeyValue"
            bridge={bridge}
            depth={depth + 1}
            element={element}
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
