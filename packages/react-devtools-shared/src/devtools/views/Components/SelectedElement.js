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
import {TreeDispatcherContext, TreeStateContext} from './TreeContext';
import {BridgeContext, ContextMenuContext, StoreContext} from '../context';
import ContextMenu from '../../ContextMenu/ContextMenu';
import ContextMenuItem from '../../ContextMenu/ContextMenuItem';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import Icon from '../Icon';
import HooksTree from './HooksTree';
import {ModalDialogContext} from '../ModalDialog';
import HocBadges from './HocBadges';
import InspectedElementTree from './InspectedElementTree';
import {InspectedElementContext} from './InspectedElementContext';
import ViewElementSourceContext from './ViewElementSourceContext';
import NativeStyleEditor from './NativeStyleEditor';
import Toggle from '../Toggle';
import Badge from './Badge';
import {useHighlightNativeElement} from '../hooks';
import {
  ComponentFilterElementType,
  ElementTypeClass,
  ElementTypeForwardRef,
  ElementTypeFunction,
  ElementTypeMemo,
  ElementTypeSuspense,
} from 'react-devtools-shared/src/types';

import styles from './SelectedElement.css';

import type {ContextMenuContextType} from '../context';
import type {
  CopyInspectedElementPath,
  GetInspectedElementPath,
  InspectedElementContextType,
  StoreAsGlobal,
} from './InspectedElementContext';
import type {Element, InspectedElement} from './types';
import type {ElementType} from 'react-devtools-shared/src/types';

export type Props = {||};

export default function SelectedElement(_: Props) {
  const {inspectedElementID} = useContext(TreeStateContext);
  const dispatch = useContext(TreeDispatcherContext);
  const {canViewElementSourceFunction, viewElementSourceFunction} = useContext(
    ViewElementSourceContext,
  );
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);
  const {dispatch: modalDialogDispatch} = useContext(ModalDialogContext);

  const {
    copyInspectedElementPath,
    getInspectedElementPath,
    getInspectedElement,
    storeAsGlobal,
  } = useContext<InspectedElementContextType>(InspectedElementContext);

  const element =
    inspectedElementID !== null
      ? store.getElementByID(inspectedElementID)
      : null;

  const inspectedElement =
    inspectedElementID != null ? getInspectedElement(inspectedElementID) : null;

  const highlightElement = useCallback(() => {
    if (element !== null && inspectedElementID !== null) {
      const rendererID = store.getRendererIDForElement(inspectedElementID);
      if (rendererID !== null) {
        bridge.send('highlightNativeElement', {
          displayName: element.displayName,
          hideAfterTimeout: true,
          id: inspectedElementID,
          openNativeElementsPanel: true,
          rendererID,
          scrollIntoView: true,
        });
      }
    }
  }, [bridge, element, inspectedElementID, store]);

  const logElement = useCallback(() => {
    if (inspectedElementID !== null) {
      const rendererID = store.getRendererIDForElement(inspectedElementID);
      if (rendererID !== null) {
        bridge.send('logElementToConsole', {
          id: inspectedElementID,
          rendererID,
        });
      }
    }
  }, [bridge, inspectedElementID, store]);

  const viewSource = useCallback(() => {
    if (viewElementSourceFunction != null && inspectedElement !== null) {
      viewElementSourceFunction(
        inspectedElement.id,
        ((inspectedElement: any): InspectedElement),
      );
    }
  }, [inspectedElement, viewElementSourceFunction]);

  // In some cases (e.g. FB internal usage) the standalone shell might not be able to view the source.
  // To detect this case, we defer to an injected helper function (if present).
  const canViewSource =
    inspectedElement !== null &&
    inspectedElement.canViewSource &&
    viewElementSourceFunction !== null &&
    (canViewElementSourceFunction === null ||
      canViewElementSourceFunction(inspectedElement));

  const isSuspended =
    element !== null &&
    element.type === ElementTypeSuspense &&
    inspectedElement != null &&
    inspectedElement.state != null;

  const canToggleSuspense =
    inspectedElement != null && inspectedElement.canToggleSuspense;

  // TODO (suspense toggle) Would be nice to eventually use a two setState pattern here as well.
  const toggleSuspended = useCallback(() => {
    let nearestSuspenseElement = null;
    let currentElement = element;
    while (currentElement !== null) {
      if (currentElement.type === ElementTypeSuspense) {
        nearestSuspenseElement = currentElement;
        break;
      } else if (currentElement.parentID > 0) {
        currentElement = store.getElementByID(currentElement.parentID);
      } else {
        currentElement = null;
      }
    }

    // If we didn't find a Suspense ancestor, we can't suspend.
    // Instead we can show a warning to the user.
    if (nearestSuspenseElement === null) {
      modalDialogDispatch({
        type: 'SHOW',
        content: <CannotSuspendWarningMessage />,
      });
    } else {
      const nearestSuspenseElementID = nearestSuspenseElement.id;

      // If we're suspending from an arbitary (non-Suspense) component, select the nearest Suspense element in the Tree.
      // This way when the fallback UI is shown and the current element is hidden, something meaningful is selected.
      if (nearestSuspenseElement !== element) {
        dispatch({
          type: 'SELECT_ELEMENT_BY_ID',
          payload: nearestSuspenseElementID,
        });
      }

      const rendererID = store.getRendererIDForElement(
        nearestSuspenseElementID,
      );

      // Toggle suspended
      if (rendererID !== null) {
        bridge.send('overrideSuspense', {
          id: nearestSuspenseElementID,
          rendererID,
          forceFallback: !isSuspended,
        });
      }
    }
  }, [bridge, dispatch, element, isSuspended, modalDialogDispatch, store]);

  if (element === null) {
    return (
      <div className={styles.SelectedElement}>
        <div className={styles.TitleRow} />
      </div>
    );
  }

  return (
    <div className={styles.SelectedElement}>
      <div className={styles.TitleRow}>
        {element.key && (
          <>
            <div className={styles.Key} title={`key "${element.key}"`}>
              {element.key}
            </div>
            <div className={styles.KeyArrow} />
          </>
        )}

        <div className={styles.SelectedComponentName}>
          <div className={styles.Component} title={element.displayName}>
            {element.displayName}
          </div>
        </div>

        {canToggleSuspense && (
          <Toggle
            className={styles.IconButton}
            isChecked={isSuspended}
            onChange={toggleSuspended}
            title={
              isSuspended
                ? 'Unsuspend the selected component'
                : 'Suspend the selected component'
            }>
            <ButtonIcon type="suspend" />
          </Toggle>
        )}
        {store.supportsNativeInspection && (
          <Button
            className={styles.IconButton}
            onClick={highlightElement}
            title="Inspect the matching DOM element">
            <ButtonIcon type="view-dom" />
          </Button>
        )}
        <Button
          className={styles.IconButton}
          onClick={logElement}
          title="Log this component data to the console">
          <ButtonIcon type="log-data" />
        </Button>
        <Button
          className={styles.IconButton}
          disabled={!canViewSource}
          onClick={viewSource}
          title="View source for this element">
          <ButtonIcon type="view-source" />
        </Button>
      </div>

      {inspectedElement === null && (
        <div className={styles.Loading}>Loading...</div>
      )}

      {inspectedElement !== null && (
        <InspectedElementView
          key={
            inspectedElementID /* Force reset when seleted Element changes */
          }
          copyInspectedElementPath={copyInspectedElementPath}
          element={element}
          getInspectedElementPath={getInspectedElementPath}
          inspectedElement={inspectedElement}
          storeAsGlobal={storeAsGlobal}
        />
      )}
    </div>
  );
}

export type CopyPath = (path: Array<string | number>) => void;
export type InspectPath = (path: Array<string | number>) => void;

type InspectedElementViewProps = {|
  copyInspectedElementPath: CopyInspectedElementPath,
  element: Element,
  getInspectedElementPath: GetInspectedElementPath,
  inspectedElement: InspectedElement,
  storeAsGlobal: StoreAsGlobal,
|};

const IS_SUSPENDED = 'Suspended';

function InspectedElementView({
  copyInspectedElementPath,
  element,
  getInspectedElementPath,
  inspectedElement,
  storeAsGlobal,
}: InspectedElementViewProps) {
  const {id, type} = element;
  const {
    canEditFunctionProps,
    canEditHooks,
    canToggleSuspense,
    hasLegacyContext,
    context,
    hooks,
    owners,
    props,
    source,
    state,
  } = inspectedElement;

  const {ownerID} = useContext(TreeStateContext);
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  const {
    isEnabledForInspectedElement,
    viewAttributeSourceFunction,
  } = useContext<ContextMenuContextType>(ContextMenuContext);

  const inspectContextPath = useCallback(
    (path: Array<string | number>) => {
      getInspectedElementPath(id, ['context', ...path]);
    },
    [getInspectedElementPath, id],
  );
  const inspectPropsPath = useCallback(
    (path: Array<string | number>) => {
      getInspectedElementPath(id, ['props', ...path]);
    },
    [getInspectedElementPath, id],
  );
  const inspectStatePath = useCallback(
    (path: Array<string | number>) => {
      getInspectedElementPath(id, ['state', ...path]);
    },
    [getInspectedElementPath, id],
  );

  let overrideContextFn = null;
  let overridePropsFn = null;
  let overrideStateFn = null;
  let overrideSuspenseFn = null;
  if (type === ElementTypeClass) {
    overrideContextFn = (path: Array<string | number>, value: any) => {
      const rendererID = store.getRendererIDForElement(id);
      if (rendererID !== null) {
        bridge.send('overrideContext', {id, path, rendererID, value});
      }
    };
    overridePropsFn = (path: Array<string | number>, value: any) => {
      const rendererID = store.getRendererIDForElement(id);
      if (rendererID !== null) {
        bridge.send('overrideProps', {id, path, rendererID, value});
      }
    };
    overrideStateFn = (path: Array<string | number>, value: any) => {
      const rendererID = store.getRendererIDForElement(id);
      if (rendererID !== null) {
        bridge.send('overrideState', {id, path, rendererID, value});
      }
    };
  } else if (
    (type === ElementTypeFunction ||
      type === ElementTypeMemo ||
      type === ElementTypeForwardRef) &&
    canEditFunctionProps
  ) {
    overridePropsFn = (path: Array<string | number>, value: any) => {
      const rendererID = store.getRendererIDForElement(id);
      if (rendererID !== null) {
        bridge.send('overrideProps', {id, path, rendererID, value});
      }
    };
  } else if (type === ElementTypeSuspense && canToggleSuspense) {
    overrideSuspenseFn = (path: Array<string | number>, value: boolean) => {
      if (path.length !== 1 && path !== IS_SUSPENDED) {
        throw new Error('Unexpected path.');
      }
      const rendererID = store.getRendererIDForElement(id);
      if (rendererID !== null) {
        bridge.send('overrideSuspense', {
          id,
          rendererID,
          forceFallback: value,
        });
      }
    };
  }

  return (
    <Fragment>
      <div className={styles.InspectedElement}>
        <HocBadges element={element} />
        <InspectedElementTree
          label="props"
          data={props}
          inspectPath={inspectPropsPath}
          overrideValueFn={overridePropsFn}
          pathRoot="props"
          showWhenEmpty={true}
          canAddEntries={typeof overridePropsFn === 'function'}
        />
        {type === ElementTypeSuspense ? (
          <InspectedElementTree
            label="suspense"
            data={{
              [IS_SUSPENDED]: state !== null,
            }}
            overrideValueFn={overrideSuspenseFn}
          />
        ) : (
          <InspectedElementTree
            label="state"
            data={state}
            inspectPath={inspectStatePath}
            overrideValueFn={overrideStateFn}
            pathRoot="state"
          />
        )}
        <HooksTree canEditHooks={canEditHooks} hooks={hooks} id={id} />
        <InspectedElementTree
          label={hasLegacyContext ? 'legacy context' : 'context'}
          data={context}
          inspectPath={inspectContextPath}
          overrideValueFn={overrideContextFn}
          pathRoot="context"
        />

        <NativeStyleEditor />

        {ownerID === null && owners !== null && owners.length > 0 && (
          <div className={styles.Owners}>
            <div className={styles.OwnersHeader}>rendered by</div>
            {owners.map(owner => (
              <OwnerView
                key={owner.id}
                displayName={owner.displayName || 'Anonymous'}
                hocDisplayNames={owner.hocDisplayNames}
                id={owner.id}
                isInStore={store.containsElement(owner.id)}
                type={owner.type}
              />
            ))}
          </div>
        )}

        {source !== null && (
          <Source fileName={source.fileName} lineNumber={source.lineNumber} />
        )}
      </div>

      {isEnabledForInspectedElement && (
        <ContextMenu id="SelectedElement">
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

function CannotSuspendWarningMessage() {
  const store = useContext(StoreContext);
  const areSuspenseElementsHidden = !!store.componentFilters.find(
    filter =>
      filter.type === ComponentFilterElementType &&
      filter.value === ElementTypeSuspense &&
      filter.isEnabled,
  );

  // Has the user filted out Suspense nodes from the tree?
  // If so, the selected element might actually be in a Suspense tree after all.
  if (areSuspenseElementsHidden) {
    return (
      <div className={styles.CannotSuspendWarningMessage}>
        Suspended state cannot be toggled while Suspense components are hidden.
        Disable the filter and try agan.
      </div>
    );
  } else {
    return (
      <div className={styles.CannotSuspendWarningMessage}>
        The selected element is not within a Suspense container. Suspending it
        would cause an error.
      </div>
    );
  }
}
