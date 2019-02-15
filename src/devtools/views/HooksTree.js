// @flow

import React from 'react';
import { KeyValue } from './InspectedElementTree';
import styles from './HooksTree.css';

import type { HooksNode, HooksTree } from 'src/backend/types';

export function HooksTreeView({ hooksTree }: { hooksTree: HooksTree | null }) {
  if (hooksTree === null) {
    return null;
  } else {
    return (
      <div className={styles.HooksTreeView}>
        <div className={styles.Item}>hooks</div>
        <InnerHooksTreeView hooksTree={hooksTree} />
      </div>
    );
  }
}

export function InnerHooksTreeView({ hooksTree }: { hooksTree: HooksTree }) {
  // $FlowFixMe "Missing type annotation for U" whatever that means
  return hooksTree.map((hooksNode, index) => (
    <HooksNodeView key={index} hooksNode={hooksTree[index]} />
  ));
}

function HooksNodeView({ hooksNode }: { hooksNode: HooksNode }) {
  const { name, subHooks, value } = hooksNode;

  // TODO Add click and key handlers for toggling element open/close state.
  // TODO Support editable props

  const isCustomHook = subHooks.length > 0;

  const type = typeof value;

  let displayValue;
  let isComplexDisplayValue = false;

  // Format data for display to mimic the props/state/context for now.
  if (type === 'number' || type === 'string' || type === 'boolean') {
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
        <div className={styles.HooksNode}>
          <div className={styles.NameValueRow}>
            <span className={styles.Name}>{name}: </span>
          </div>
          <KeyValue depth={1} name="DebugValue" value={value} />
          <InnerHooksTreeView hooksTree={subHooks} />
        </div>
      );
    } else {
      return (
        <div className={styles.HooksNode}>
          <div className={styles.NameValueRow}>
            <span className={styles.Name}>{name}: </span> {/* $FlowFixMe */}
            <span className={styles.Value}>{displayValue}</span>
          </div>
          <InnerHooksTreeView hooksTree={subHooks} />
        </div>
      );
    }
  } else {
    if (isComplexDisplayValue) {
      return (
        <div className={styles.HooksNode}>
          <KeyValue depth={0} name={name} value={value} />
        </div>
      );
    } else {
      return (
        <div className={styles.HooksNode}>
          <div className={styles.NameValueRow}>
            <span className={styles.Name}>{name}: </span>
            {/* $FlowFixMe */}
            <span className={styles.Value}>{displayValue}</span>
          </div>
        </div>
      );
    }
  }
}

// $FlowFixMe
export default React.memo(HooksTreeView);
