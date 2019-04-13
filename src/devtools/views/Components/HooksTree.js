// @flow

import { copy } from 'clipboard-js';
import React, { useCallback, useContext, useState } from 'react';
import { BridgeContext, StoreContext } from '../context';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import EditableValue from './EditableValue';
import ExpandCollapseToggle from './ExpandCollapseToggle';
import KeyValue from './KeyValue';
import { serializeHooksForCopy } from '../utils';
import styles from './HooksTree.css';
import { meta } from '../../../hydration';

import type { HooksNode, HooksTree } from 'src/backend/types';

type HooksTreeViewProps = {|
  canEditHooks: boolean,
  hooks: HooksTree | null,
  id: number,
|};

export function HooksTreeView({ canEditHooks, hooks, id }: HooksTreeViewProps) {
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
        <InnerHooksTreeView canEditHooks={canEditHooks} hooks={hooks} id={id} />
      </div>
    );
  }
}

type InnerHooksTreeViewProps = {|
  canEditHooks: boolean,
  hooks: HooksTree,
  id: number,
|};

export function InnerHooksTreeView({
  canEditHooks,
  hooks,
  id,
}: InnerHooksTreeViewProps) {
  // $FlowFixMe "Missing type annotation for U" whatever that means
  return hooks.map((hook, index) => (
    <HookView
      key={index}
      canEditHooks={canEditHooks}
      hook={hooks[index]}
      id={id}
    />
  ));
}

type HookViewProps = {|
  canEditHooks: boolean,
  hook: HooksNode,
  id: number,
  path?: Array<any>,
|};

function HookView({ canEditHooks, hook, id, path = [] }: HookViewProps) {
  const { name, id: hookID, isStateEditable, subHooks, value } = hook;

  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleIsOpen = useCallback(
    () => setIsOpen(prevIsOpen => !prevIsOpen),
    []
  );

  if (hook.hasOwnProperty(meta.inspected)) {
    // This Hook is too deep and hasn't been hydrated.
    // TODO: show UI to load its data.
    return (
      <div className={styles.Hook}>
        <div className={styles.NameValueRow}>
          <span className={styles.TruncationIndicator}>...</span>
        </div>
      </div>
    );
  }

  // TODO Add click and key handlers for toggling element open/close state.

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
    if (isComplexDisplayValue) {
      return (
        <div className={styles.Hook}>
          <div className={styles.NameValueRow}>
            <ExpandCollapseToggle isOpen={isOpen} setIsOpen={setIsOpen} />
            <span onClick={toggleIsOpen} className={styles.Name}>
              {name}
            </span>
          </div>
          <div className={styles.Children} hidden={!isOpen}>
            <KeyValue depth={1} name="DebugValue" value={value} />
            <InnerHooksTreeView
              canEditHooks={canEditHooks}
              hooks={subHooks}
              id={id}
            />
          </div>
        </div>
      );
    } else {
      return (
        <div className={styles.Hook}>
          <div className={styles.NameValueRow}>
            <ExpandCollapseToggle isOpen={isOpen} setIsOpen={setIsOpen} />
            <span onClick={toggleIsOpen} className={styles.Name}>
              {name}
            </span>{' '}
            {/* $FlowFixMe */}
            <span className={styles.Value}>{displayValue}</span>
          </div>
          <div className={styles.Children} hidden={!isOpen}>
            <InnerHooksTreeView
              canEditHooks={canEditHooks}
              hooks={subHooks}
              id={id}
            />
          </div>
        </div>
      );
    }
  } else {
    let overrideValueFn = null;
    // TODO Maybe read editable value from debug hook?
    if (canEditHooks && isStateEditable) {
      overrideValueFn = (path: Array<string | number>, value: any) => {
        const rendererID = store.getRendererIDForElement(id);
        bridge.send('overrideHookState', {
          id,
          hookID,
          path,
          rendererID,
          value,
        });
      };
    }

    if (isComplexDisplayValue) {
      return (
        <div className={styles.Hook}>
          <KeyValue
            depth={1}
            name={name}
            overrideValueFn={overrideValueFn}
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
              }
            >
              {name}
            </span>
            {typeof overrideValueFn === 'function' ? (
              <EditableValue
                dataType={type}
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
