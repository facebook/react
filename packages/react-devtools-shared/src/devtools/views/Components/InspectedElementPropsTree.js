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
import {OptionsContext} from '../context';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import KeyValue from './KeyValue';
import NewKeyValue from './NewKeyValue';
import {alphaSortEntries, serializeDataForCopy} from '../utils';
import Store from '../../store';
import styles from './InspectedElementSharedStyles.css';
import {
  ElementTypeClass,
  ElementTypeSuspense,
} from 'react-devtools-shared/src/frontend/types';
import {withPermissionsCheck} from 'react-devtools-shared/src/frontend/utils/withPermissionsCheck';

import type {InspectedElement} from 'react-devtools-shared/src/frontend/types';
import type {FrontendBridge} from 'react-devtools-shared/src/bridge';
import type {Element} from 'react-devtools-shared/src/frontend/types';

type Props = {
  bridge: FrontendBridge,
  element: Element,
  inspectedElement: InspectedElement,
  store: Store,
};

export default function InspectedElementPropsTree({
  bridge,
  element,
  inspectedElement,
  store,
}: Props): React.Node {
  const {readOnly} = React.useContext(OptionsContext);

  const {
    canEditFunctionProps,
    canEditFunctionPropsDeletePaths,
    canEditFunctionPropsRenamePaths,
    props,
    type,
  } = inspectedElement;

  if (type === ElementTypeSuspense) {
    // Skip showing the props for Suspense. We want to give more real estate to the
    // "Suspended by" for Suspense boundaries. We could maybe show it further below
    // but in practice, the props of Suspense boundaries are not very useful to
    // inspect because the name shows in the tree already. The children in the tree
    // will be either the "fallback" or "children" prop which you can already inspect
    // but resuspending the tree.
    return null;
  }

  const canDeletePaths =
    type === ElementTypeClass || canEditFunctionPropsDeletePaths;
  const canEditValues =
    !readOnly && (type === ElementTypeClass || canEditFunctionProps);
  const canRenamePaths =
    type === ElementTypeClass || canEditFunctionPropsRenamePaths;

  // Skip the section for null props.
  if (props == null) {
    return null;
  }

  const entries = Object.entries(props);
  entries.sort(alphaSortEntries);
  const isEmpty = entries.length === 0;

  const handleCopy = withPermissionsCheck(
    {permissions: ['clipboardWrite']},
    () => copy(serializeDataForCopy(props)),
  );

  return (
    <div data-testname="InspectedElementPropsTree">
      <div className={styles.HeaderRow}>
        <div className={styles.Header}>props</div>
        {!isEmpty && (
          <Button onClick={handleCopy} title="Copy to clipboard">
            <ButtonIcon type="copy" />
          </Button>
        )}
      </div>
      {!isEmpty &&
        entries.map(([name, value]) => (
          <KeyValue
            key={name}
            alphaSort={true}
            bridge={bridge}
            canDeletePaths={canDeletePaths}
            canEditValues={canEditValues}
            canRenamePaths={canRenamePaths}
            depth={1}
            element={element}
            hidden={false}
            inspectedElement={inspectedElement}
            name={name}
            path={[name]}
            pathRoot="props"
            store={store}
            value={value}
          />
        ))}
      {canEditValues && (
        <NewKeyValue
          bridge={bridge}
          depth={0}
          hidden={false}
          inspectedElement={inspectedElement}
          path={[]}
          store={store}
          type="props"
        />
      )}
    </div>
  );
}
