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
import {Fragment, useCallback, useContext} from 'react';
import {TreeDispatcherContext} from './TreeContext';
import {BridgeContext, ContextMenuContext, StoreContext} from '../context';
import ContextMenu from '../../ContextMenu/ContextMenu';
import ContextMenuItem from '../../ContextMenu/ContextMenuItem';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import Icon from '../Icon';
import HocBadges from './HocBadges';
import InspectedElementContextTree from './InspectedElementContextTree';
import InspectedElementHooksTree from './InspectedElementHooksTree';
import InspectedElementPropsTree from './InspectedElementPropsTree';
import InspectedElementStateTree from './InspectedElementStateTree';
import InspectedElementSuspenseToggle from './InspectedElementSuspenseToggle';
import NativeStyleEditor from './NativeStyleEditor';
import Badge from './Badge';
import {useHighlightNativeElement} from '../hooks';

import styles from './InspectedElementView.css';

import type {ContextMenuContextType} from '../context';
import type {
  CopyInspectedElementPath,
  GetInspectedElementPath,
  StoreAsGlobal,
} from './InspectedElementContext';
import type {Element, InspectedElement, Owner} from './types';
import type {ElementType} from 'react-devtools-shared/src/types';

export type CopyPath = (path: Array<string | number>) => void;
export type InspectPath = (path: Array<string | number>) => void;

type Props = {|
  copyInspectedElementPath: CopyInspectedElementPath,
  element: Element,
  getInspectedElementPath: GetInspectedElementPath,
  inspectedElement: InspectedElement,
  storeAsGlobal: StoreAsGlobal,
|};

export default function InspectedElementView({
  copyInspectedElementPath,
  element,
  getInspectedElementPath,
  inspectedElement,
  storeAsGlobal,
}: Props) {
  const {id} = element;
  const {
    owners,
    rendererPackageName,
    rendererVersion,
    rootType,
    source,
  } = inspectedElement;

  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  const {
    isEnabledForInspectedElement: isContextMenuEnabledForInspectedElement,
    viewAttributeSourceFunction,
  } = useContext<ContextMenuContextType>(ContextMenuContext);

  const rendererLabel =
    rendererPackageName !== null && rendererVersion !== null
      ? `${rendererPackageName}@${rendererVersion}`
      : null;
  const showOwnersList = owners !== null && owners.length > 0;
  const showRenderedBy =
    showOwnersList || rendererLabel !== null || rootType !== null;

  return (
    <Fragment>
      <div className={styles.InspectedElement}>
        <HocBadges element={element} />

        <InspectedElementPropsTree
          bridge={bridge}
          getInspectedElementPath={getInspectedElementPath}
          inspectedElement={inspectedElement}
          store={store}
        />

        <InspectedElementSuspenseToggle
          bridge={bridge}
          inspectedElement={inspectedElement}
          store={store}
        />

        <InspectedElementStateTree
          bridge={bridge}
          getInspectedElementPath={getInspectedElementPath}
          inspectedElement={inspectedElement}
          store={store}
        />

        <InspectedElementHooksTree
          bridge={bridge}
          getInspectedElementPath={getInspectedElementPath}
          inspectedElement={inspectedElement}
          store={store}
        />

        <InspectedElementContextTree
          bridge={bridge}
          getInspectedElementPath={getInspectedElementPath}
          inspectedElement={inspectedElement}
          store={store}
        />

        <NativeStyleEditor />

        {showRenderedBy && (
          <div className={styles.Owners}>
            <div className={styles.OwnersHeader}>rendered by</div>
            {showOwnersList &&
              ((owners: any): Array<Owner>).map(owner => (
                <OwnerView
                  key={owner.id}
                  displayName={owner.displayName || 'Anonymous'}
                  hocDisplayNames={owner.hocDisplayNames}
                  id={owner.id}
                  isInStore={store.containsElement(owner.id)}
                  type={owner.type}
                />
              ))}
            {rootType !== null && (
              <div className={styles.OwnersMetaField}>{rootType}</div>
            )}
            {rendererLabel !== null && (
              <div className={styles.OwnersMetaField}>{rendererLabel}</div>
            )}
          </div>
        )}

        {source !== null && (
          <Source fileName={source.fileName} lineNumber={source.lineNumber} />
        )}
      </div>

      {isContextMenuEnabledForInspectedElement && (
        <ContextMenu id="InspectedElement">
          {data => (
            <Fragment>
              <ContextMenuItem
                onClick={() => copyInspectedElementPath(id, data.path)}
                title="Copy value to clipboard">
                <Icon className={styles.ContextMenuIcon} type="copy" /> Copy
                value to clipboard
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => storeAsGlobal(id, data.path)}
                title="Store as global variable">
                <Icon
                  className={styles.ContextMenuIcon}
                  type="store-as-global-variable"
                />{' '}
                Store as global variable
              </ContextMenuItem>
              {viewAttributeSourceFunction !== null &&
                data.type === 'function' && (
                  <ContextMenuItem
                    onClick={() => viewAttributeSourceFunction(id, data.path)}
                    title="Go to definition">
                    <Icon className={styles.ContextMenuIcon} type="code" /> Go
                    to definition
                  </ContextMenuItem>
                )}
            </Fragment>
          )}
        </ContextMenu>
      )}
    </Fragment>
  );
}

// This function is based on describeComponentFrame() in packages/shared/ReactComponentStackFrame
function formatSourceForDisplay(fileName: string, lineNumber: string) {
  const BEFORE_SLASH_RE = /^(.*)[\\\/]/;

  let nameOnly = fileName.replace(BEFORE_SLASH_RE, '');

  // In DEV, include code for a common special case:
  // prefer "folder/index.js" instead of just "index.js".
  if (/^index\./.test(nameOnly)) {
    const match = fileName.match(BEFORE_SLASH_RE);
    if (match) {
      const pathBeforeSlash = match[1];
      if (pathBeforeSlash) {
        const folderName = pathBeforeSlash.replace(BEFORE_SLASH_RE, '');
        nameOnly = folderName + '/' + nameOnly;
      }
    }
  }

  return `${nameOnly}:${lineNumber}`;
}

type SourceProps = {|
  fileName: string,
  lineNumber: string,
|};

function Source({fileName, lineNumber}: SourceProps) {
  const handleCopy = () => copy(`${fileName}:${lineNumber}`);
  return (
    <div className={styles.Source}>
      <div className={styles.SourceHeaderRow}>
        <div className={styles.SourceHeader}>source</div>
        <Button onClick={handleCopy} title="Copy to clipboard">
          <ButtonIcon type="copy" />
        </Button>
      </div>
      <div className={styles.SourceOneLiner}>
        {formatSourceForDisplay(fileName, lineNumber)}
      </div>
    </div>
  );
}

type OwnerViewProps = {|
  displayName: string,
  hocDisplayNames: Array<string> | null,
  id: number,
  isInStore: boolean,
  type: ElementType,
|};

function OwnerView({
  displayName,
  hocDisplayNames,
  id,
  isInStore,
  type,
}: OwnerViewProps) {
  const dispatch = useContext(TreeDispatcherContext);
  const {
    highlightNativeElement,
    clearHighlightNativeElement,
  } = useHighlightNativeElement();

  const handleClick = useCallback(
    () =>
      dispatch({
        type: 'SELECT_ELEMENT_BY_ID',
        payload: id,
      }),
    [dispatch, id],
  );

  const onMouseEnter = () => highlightNativeElement(id);

  const onMouseLeave = clearHighlightNativeElement;

  return (
    <Button
      key={id}
      className={styles.OwnerButton}
      disabled={!isInStore}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}>
      <span className={styles.OwnerContent}>
        <span
          className={`${styles.Owner} ${isInStore ? '' : styles.NotInStore}`}
          title={displayName}>
          {displayName}
        </span>
        <Badge hocDisplayNames={hocDisplayNames} type={type} />
      </span>
    </Button>
  );
}
