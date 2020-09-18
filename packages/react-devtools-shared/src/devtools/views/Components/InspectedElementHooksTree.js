/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {copy} from 'clipboard-js';
import * as React from 'react';
import {useCallback, useContext, useRef, useState} from 'react';
import {BridgeContext, StoreContext} from '../context';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import ExpandCollapseToggle from './ExpandCollapseToggle';
import KeyValue from './KeyValue';
import {getMetaValueLabel, serializeHooksForCopy} from '../utils';
import Store from '../../store';
import styles from './InspectedElementHooksTree.css';
import useContextMenu from '../../ContextMenu/useContextMenu';
import {meta} from '../../../hydration';

import type {InspectedElement} from './types';
import type {GetInspectedElementPath} from './InspectedElementContext';
import type {HooksNode, HooksTree} from 'react-debug-tools/src/ReactDebugHooks';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';

type HooksTreeViewProps = {|
  bridge: FrontendBridge,
  getInspectedElementPath: GetInspectedElementPath,
  inspectedElement: InspectedElement,
  store: Store,
|};

export function InspectedElementHooksTree({
  bridge,
  getInspectedElementPath,
  inspectedElement,
  store,
}: HooksTreeViewProps) {
  const {hooks, id} = inspectedElement;

  const handleCopy = () => copy(serializeHooksForCopy(hooks));

  if (hooks === null) {
    return null;
  } else {
    return (
      <div className={styles.HooksTreeView}>
        <div className={styles.HeaderRow}>
          <div className={styles.Header}>hooks</div>
          <Button onClick={handleCopy} title="Copy to clipboard">
            <ButtonIcon type="copy" />
          </Button>
        </div>
        <InnerHooksTreeView
          hooks={hooks}
          id={id}
          getInspectedElementPath={getInspectedElementPath}
          inspectedElement={inspectedElement}
          path={[]}
        />
      </div>
    );
  }
}

type InnerHooksTreeViewProps = {|
  getInspectedElementPath: GetInspectedElementPath,
  hooks: HooksTree,
  id: number,
  inspectedElement: InspectedElement,
  path: Array<string | number>,
|};

export function InnerHooksTreeView({
  getInspectedElementPath,
  hooks,
  id,
  inspectedElement,
  path,
}: InnerHooksTreeViewProps) {
  // $FlowFixMe "Missing type annotation for U" whatever that means
  return hooks.map((hook, index) => (
    <HookView
      key={index}
      getInspectedElementPath={getInspectedElementPath}
      hook={hooks[index]}
      id={id}
      inspectedElement={inspectedElement}
      path={path.concat([index])}
    />
  ));
}

type HookViewProps = {|
  getInspectedElementPath: GetInspectedElementPath,
  hook: HooksNode,
  id: number,
  inspectedElement: InspectedElement,
  path: Array<string | number>,
|};

function HookView({
  getInspectedElementPath,
  hook,
  id,
  inspectedElement,
  path,
}: HookViewProps) {
  const {
    canEditHooks,
    canEditHooksAndDeletePaths,
    canEditHooksAndRenamePaths,
  } = inspectedElement;
  const {name, id: hookID, isStateEditable, subHooks, value} = hook;

  const isReadOnly = hookID == null || !isStateEditable;

  const canDeletePaths = !isReadOnly && canEditHooksAndDeletePaths;
  const canEditValues = !isReadOnly && canEditHooks;
  const canRenamePaths = !isReadOnly && canEditHooksAndRenamePaths;

  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleIsOpen = useCallback(
    () => setIsOpen(prevIsOpen => !prevIsOpen),
    [],
  );

  const contextMenuTriggerRef = useRef(null);

  useContextMenu({
    data: {
      path: ['hooks', ...path],
      type:
        hook !== null &&
        typeof hook === 'object' &&
        hook.hasOwnProperty(meta.type)
          ? hook[(meta.type: any)]
          : typeof value,
    },
    id: 'InspectedElement',
    ref: contextMenuTriggerRef,
  });

  if (hook.hasOwnProperty(meta.inspected)) {
    // This Hook is too deep and hasn't been hydrated.
    if (__DEV__) {
      console.warn('Unexpected dehydrated hook; this is a DevTools error.');
    }
    return (
      <div className={styles.Hook}>
        <div className={styles.NameValueRow}>
          <span className={styles.TruncationIndicator}>...</span>
        </div>
      </div>
    );
  }

  // Certain hooks are not editable at all (as identified by react-debug-tools).
  // Primative hook names (e.g. the "State" name for useState) are also never editable.
  const canRenamePathsAtDepth = depth => isStateEditable && depth > 1;

  const isCustomHook = subHooks.length > 0;

  const type = typeof value;

  let displayValue;
  let isComplexDisplayValue = false;

  // Format data for display to mimic the props/state/context for now.
  if (type === 'string') {
    displayValue = `"${((value: any): string)}"`;
  } else if (type === 'boolean') {
    displayValue = value ? 'true' : 'false';
  } else if (type === 'number') {
    displayValue = value;
  } else if (value === null) {
    displayValue = 'null';
  } else if (value === undefined) {
    displayValue = null;
  } else if (Array.isArray(value)) {
    isComplexDisplayValue = true;
    displayValue = 'Array';
  } else if (type === 'object') {
    isComplexDisplayValue = true;
    displayValue = 'Object';
  }

  if (isCustomHook) {
    const subHooksView = Array.isArray(subHooks) ? (
      <InnerHooksTreeView
        getInspectedElementPath={getInspectedElementPath}
        hooks={subHooks}
        id={id}
        inspectedElement={inspectedElement}
        path={path.concat(['subHooks'])}
      />
    ) : (
      <KeyValue
        alphaSort={false}
        bridge={bridge}
        canDeletePaths={canDeletePaths}
        canEditValues={canEditValues}
        canRenamePaths={canRenamePaths}
        canRenamePathsAtDepth={canRenamePathsAtDepth}
        depth={1}
        getInspectedElementPath={getInspectedElementPath}
        hookID={hookID}
        inspectedElement={inspectedElement}
        name="subHooks"
        path={path.concat(['subHooks'])}
        store={store}
        type="hooks"
        value={subHooks}
      />
    );

    if (isComplexDisplayValue) {
      return (
        <div className={styles.Hook}>
          <div ref={contextMenuTriggerRef} className={styles.NameValueRow}>
            <ExpandCollapseToggle isOpen={isOpen} setIsOpen={setIsOpen} />
            <span
              onClick={toggleIsOpen}
              className={name !== '' ? styles.Name : styles.NameAnonymous}>
              {name || 'Anonymous'}
            </span>
            <span className={styles.Value} onClick={toggleIsOpen}>
              {isOpen || getMetaValueLabel(value)}
            </span>
          </div>
          <div className={styles.Children} hidden={!isOpen}>
            <KeyValue
              alphaSort={false}
              bridge={bridge}
              canDeletePaths={canDeletePaths}
              canEditValues={canEditValues}
              canRenamePaths={canRenamePaths}
              canRenamePathsAtDepth={canRenamePathsAtDepth}
              depth={1}
              getInspectedElementPath={getInspectedElementPath}
              hookID={hookID}
              inspectedElement={inspectedElement}
              name="DebugValue"
              path={path.concat(['value'])}
              pathRoot="hooks"
              store={store}
              value={value}
            />
            {subHooksView}
          </div>
        </div>
      );
    } else {
      return (
        <div className={styles.Hook}>
          <div ref={contextMenuTriggerRef} className={styles.NameValueRow}>
            <ExpandCollapseToggle isOpen={isOpen} setIsOpen={setIsOpen} />
            <span
              onClick={toggleIsOpen}
              className={name !== '' ? styles.Name : styles.NameAnonymous}>
              {name || 'Anonymous'}
            </span>{' '}
            {/* $FlowFixMe */}
            <span className={styles.Value} onClick={toggleIsOpen}>
              {displayValue}
            </span>
          </div>
          <div className={styles.Children} hidden={!isOpen}>
            {subHooksView}
          </div>
        </div>
      );
    }
  } else {
    if (isComplexDisplayValue) {
      return (
        <div className={styles.Hook}>
          <KeyValue
            alphaSort={false}
            bridge={bridge}
            canDeletePaths={canDeletePaths}
            canEditValues={canEditValues}
            canRenamePaths={canRenamePaths}
            canRenamePathsAtDepth={canRenamePathsAtDepth}
            depth={1}
            getInspectedElementPath={getInspectedElementPath}
            hookID={hookID}
            inspectedElement={inspectedElement}
            name={name}
            path={path.concat(['value'])}
            pathRoot="hooks"
            store={store}
            value={value}
          />
        </div>
      );
    } else {
      return (
        <div className={styles.Hook}>
          <KeyValue
            alphaSort={false}
            bridge={bridge}
            canDeletePaths={false}
            canEditValues={canEditValues}
            canRenamePaths={false}
            depth={1}
            getInspectedElementPath={getInspectedElementPath}
            hookID={hookID}
            inspectedElement={inspectedElement}
            name={name}
            path={[]}
            pathRoot="hooks"
            store={store}
            value={value}
          />
        </div>
      );
    }
  }
}

// $FlowFixMe
export default React.memo(InspectedElementHooksTree);
