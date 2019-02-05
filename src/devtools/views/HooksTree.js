// @flow

import React from 'react';
import { getMetaValueLabel } from './utils';
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

  // Format data for display to mimic the props/state/context for now.
  const type = typeof value;
  let displayValue;
  if (isCustomHook && value === undefined) {
    displayValue = null;
  } else if (
    type === 'number' ||
    type === 'string' ||
    type === 'boolean' ||
    value == null
  ) {
    displayValue = value;
  } else {
    displayValue = getMetaValueLabel(value);
  }

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

// $FlowFixMe
export default React.memo(HooksTreeView);
