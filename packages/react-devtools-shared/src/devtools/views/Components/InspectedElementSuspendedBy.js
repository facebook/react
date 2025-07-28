/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {copy} from 'clipboard-js';
import * as React from 'react';
import {useState} from 'react';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import KeyValue from './KeyValue';
import {serializeDataForCopy} from '../utils';
import Store from '../../store';
import styles from './InspectedElementSharedStyles.css';
import {withPermissionsCheck} from 'react-devtools-shared/src/frontend/utils/withPermissionsCheck';
import StackTraceView from './StackTraceView';
import OwnerView from './OwnerView';

import type {InspectedElement} from 'react-devtools-shared/src/frontend/types';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type {SerializedAsyncInfo} from 'react-devtools-shared/src/frontend/types';

type RowProps = {
  bridge: FrontendBridge,
  element: Element,
  inspectedElement: InspectedElement,
  store: Store,
  asyncInfo: SerializedAsyncInfo,
  index: number,
};

function SuspendedByRow({
  bridge,
  element,
  inspectedElement,
  store,
  asyncInfo,
  index,
}: RowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const name = asyncInfo.awaited.name;
  let stack;
  let owner;
  if (asyncInfo.stack === null || asyncInfo.stack.length === 0) {
    stack = asyncInfo.awaited.stack;
    owner = asyncInfo.awaited.owner;
  } else {
    stack = asyncInfo.stack;
    owner = asyncInfo.owner;
  }
  return (
    <div className={styles.CollapsableRow}>
      <Button
        className={styles.CollapsableHeader}
        onClick={() => setIsOpen(prevIsOpen => !prevIsOpen)}
        title={`${isOpen ? 'Collapse' : 'Expand'}`}>
        <ButtonIcon
          className={styles.CollapsableHeaderIcon}
          type={isOpen ? 'expanded' : 'collapsed'}
        />
        <span className={styles.CollapsableHeaderTitle}>{name}</span>
      </Button>
      {isOpen && (
        <div className={styles.CollapsableContent}>
          <div className={styles.PreviewContainer}>
            <KeyValue
              alphaSort={true}
              bridge={bridge}
              canDeletePaths={false}
              canEditValues={false}
              canRenamePaths={false}
              depth={1}
              element={element}
              hidden={false}
              inspectedElement={inspectedElement}
              name={'Promise'}
              path={[index, 'awaited', 'value']}
              pathRoot="suspendedBy"
              store={store}
              value={asyncInfo.awaited.value}
            />
          </div>
          {stack !== null && stack.length > 0 && (
            <StackTraceView stack={stack} />
          )}
          {owner !== null && owner.id !== inspectedElement.id ? (
            <OwnerView
              key={owner.id}
              displayName={owner.displayName || 'Anonymous'}
              hocDisplayNames={owner.hocDisplayNames}
              compiledWithForget={owner.compiledWithForget}
              id={owner.id}
              isInStore={store.containsElement(owner.id)}
              type={owner.type}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}

type Props = {
  bridge: FrontendBridge,
  element: Element,
  inspectedElement: InspectedElement,
  store: Store,
};

export default function InspectedElementSuspendedBy({
  bridge,
  element,
  inspectedElement,
  store,
}: Props): React.Node {
  const {suspendedBy} = inspectedElement;

  // Skip the section if nothing suspended this component.
  if (suspendedBy == null || suspendedBy.length === 0) {
    return null;
  }

  const handleCopy = withPermissionsCheck(
    {permissions: ['clipboardWrite']},
    () => copy(serializeDataForCopy(suspendedBy)),
  );

  return (
    <div>
      <div className={styles.HeaderRow}>
        <div className={styles.Header}>suspended by</div>
        <Button onClick={handleCopy} title="Copy to clipboard">
          <ButtonIcon type="copy" />
        </Button>
      </div>
      {suspendedBy.map((asyncInfo, index) => (
        <SuspendedByRow
          key={index}
          index={index}
          asyncInfo={asyncInfo}
          bridge={bridge}
          element={element}
          inspectedElement={inspectedElement}
          store={store}
        />
      ))}
    </div>
  );
}
