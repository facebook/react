/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {copy} from 'clipboard-js';
import React, {useCallback, useContext, useState} from 'react';
import {BridgeContext, StoreContext} from '../context';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import EditableValue from './EditableValue';
import ExpandCollapseToggle from './ExpandCollapseToggle';
import {InspectedElementContext} from './InspectedElementContext';
import KeyValue from './KeyValue';
import {serializeHooksForCopy} from '../utils';
import styles from './HooksTree.css';
import {meta} from '../../../hydration';

import type {InspectPath} from './SelectedElement';
import type {HooksNode, HooksTree} from 'react-debug-tools/src/ReactDebugHooks';

type HooksTreeViewProps = {|
  canEditHooks: boolean,
  hooks: HooksTree | null,
  id: number,
|};

export function HooksTreeView({canEditHooks, hooks, id}: HooksTreeViewProps) {
  const {getInspectedElementPath} = useContext(InspectedElementContext);
  const inspectPath = useCallback(
    (path: Array<string | number>) => {
      getInspectedElementPath(id, ['hooks', ...path]);
    },
    [getInspectedElementPath, id],
  );
  const handleCopy = useCallback(() => copy(serializeHooksForCopy(hooks)), [
    hooks,
  ]);

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
          canEditHooks={canEditHooks}
          hooks={hooks}
          id={id}
          inspectPath={inspectPath}
          path={[]}
        />
      </div>
    );
  }
}

type InnerHooksTreeViewProps = {|
  canEditHooks: boolean,
  hooks: HooksTree,
  id: number,
  inspectPath: InspectPath,
  path: Array<string | number>,
|};

export function InnerHooksTreeView({
  canEditHooks,
  hooks,
  id,
  inspectPath,
  path,
}: InnerHooksTreeViewProps) {
  // $FlowFixMe "Missing type annotation for U" whatever that means
  return hooks.map((hook, index) => (
    <HookView
      key={index}
      canEditHooks={canEditHooks}
      hook={hooks[index]}
      id={id}
      inspectPath={inspectPath}
      path={path.concat([index])}
    />
  ));
}

type HookViewProps = {|
  canEditHooks: boolean,
  hook: HooksNode,
  id: number,
  inspectPath: InspectPath,
  path: Array<string | number>,
|};

function HookView({canEditHooks, hook, id, inspectPath, path}: HookViewProps) {
  const {name, id: hookID, isStateEditable, subHooks, value} = hook;

  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleIsOpen = useCallback(
    () => setIsOpen(prevIsOpen => !prevIsOpen),
    [],
  );

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
        canEditHooks={canEditHooks}
        hooks={subHooks}
        id={id}
        inspectPath={inspectPath}
        path={path.concat(['subHooks'])}
      />
    ) : (
      <KeyValue
        depth={1}
        alphaSort={false}
        inspectPath={inspectPath}
        name="subHooks"
        path={path.concat(['subHooks'])}
        value={subHooks}
      />
    );

    if (isComplexDisplayValue) {
      return (
        <div className={styles.Hook}>
          <div className={styles.NameValueRow}>
            <ExpandCollapseToggle isOpen={isOpen} setIsOpen={setIsOpen} />
            <span
              onClick={toggleIsOpen}
              className={name !== '' ? styles.Name : styles.NameAnonymous}>
              {name || 'Anonymous'}
            </span>
          </div>
          <div className={styles.Children} hidden={!isOpen}>
            <KeyValue
              depth={1}
              alphaSort={false}
              inspectPath={inspectPath}
              name="DebugValue"
              path={path.concat(['value'])}
              value={value}
            />
            {subHooksView}
          </div>
        </div>
      );
    } else {
      return (
        <div className={styles.Hook}>
          <div className={styles.NameValueRow}>
            <ExpandCollapseToggle isOpen={isOpen} setIsOpen={setIsOpen} />
            <span
              onClick={toggleIsOpen}
              className={name !== '' ? styles.Name : styles.NameAnonymous}>
              {name || 'Anonymous'}
            </span>{' '}
            {/* $FlowFixMe */}
            <span className={styles.Value}>{displayValue}</span>
          </div>
          <div className={styles.Children} hidden={!isOpen}>
            {subHooksView}
          </div>
        </div>
      );
    }
  } else {
    let overrideValueFn = null;
    // TODO Maybe read editable value from debug hook?
    if (canEditHooks && isStateEditable) {
      overrideValueFn = (
        absolutePath: Array<string | number>,
        newValue: any,
      ) => {
        const rendererID = store.getRendererIDForElement(id);
        if (rendererID !== null) {
          bridge.send('overrideHookState', {
            id,
            hookID,
            // Hooks override function expects a relative path for the specified hook (id),
            // starting with its id within the (flat) hooks list structure.
            // This relative path does not include the fake tree structure DevTools uses for display,
            // so it's important that we remove that part of the path before sending the update.
            path: absolutePath.slice(path.length + 1),
            rendererID,
            value: newValue,
          });
        }
      };
    }

    if (isComplexDisplayValue) {
      return (
        <div className={styles.Hook}>
          <KeyValue
            depth={1}
            alphaSort={false}
            inspectPath={inspectPath}
            name={name}
            overrideValueFn={overrideValueFn}
            path={path.concat(['value'])}
            value={value}
          />
        </div>
      );
    } else {
      return (
        <div className={styles.Hook}>
          <div className={styles.NameValueRow}>
            <span className={styles.ExpandCollapseToggleSpacer} />
            <span
              className={
                typeof overrideValueFn === 'function'
                  ? styles.EditableName
                  : styles.Name
              }>
              {name}
            </span>
            {typeof overrideValueFn === 'function' ? (
              <EditableValue
                overrideValueFn={overrideValueFn}
                path={[]}
                value={value}
              />
            ) : (
              // $FlowFixMe Cannot create span element because in property children
              <span className={styles.Value}>{displayValue}</span>
            )}
          </div>
        </div>
      );
    }
  }
}

// $FlowFixMe
export default React.memo(HooksTreeView);
