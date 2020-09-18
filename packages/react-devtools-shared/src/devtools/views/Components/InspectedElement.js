/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useCallback, useContext} from 'react';
import {TreeDispatcherContext, TreeStateContext} from './TreeContext';
import {BridgeContext, StoreContext} from '../context';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import {ModalDialogContext} from '../ModalDialog';
import {InspectedElementContext} from './InspectedElementContext';
import ViewElementSourceContext from './ViewElementSourceContext';
import Toggle from '../Toggle';
import {ElementTypeSuspense} from 'react-devtools-shared/src/types';
import CannotSuspendWarningMessage from './CannotSuspendWarningMessage';
import InspectedElementView from './InspectedElementView';

import styles from './InspectedElement.css';

import type {InspectedElementContextType} from './InspectedElementContext';
import type {InspectedElement} from './types';

export type Props = {||};

export default function InspectedElementWrapper(_: Props) {
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

      // If we're suspending from an arbitrary (non-Suspense) component, select the nearest Suspense element in the Tree.
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
      <div className={styles.InspectedElement}>
        <div className={styles.TitleRow} />
      </div>
    );
  }

  return (
    <div className={styles.InspectedElement}>
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
            inspectedElementID /* Force reset when selected Element changes */
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
