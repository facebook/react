// @flow

import React, { useCallback, useContext } from 'react';
import { TreeDispatcherContext, TreeStateContext } from './TreeContext';
import { BridgeContext, StoreContext } from '../context';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import HooksTree from './HooksTree';
import { ModalDialogContext } from '../ModalDialog';
import InspectedElementTree from './InspectedElementTree';
import { InspectedElementContext } from './InspectedElementContext';
import ViewElementSourceContext from './ViewElementSourceContext';
import Toggle from '../Toggle';
import {
  ComponentFilterElementType,
  ElementTypeClass,
  ElementTypeForwardRef,
  ElementTypeFunction,
  ElementTypeMemo,
  ElementTypeSuspense,
} from 'src/types';

import styles from './SelectedElement.css';

import type { Element, InspectedElement } from './types';

export type Props = {||};

export default function SelectedElement(_: Props) {
  const { inspectedElementID } = useContext(TreeStateContext);
  const dispatch = useContext(TreeDispatcherContext);
  const viewElementSource = useContext(ViewElementSourceContext);
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);
  const { dispatch: modalDialogDispatch } = useContext(ModalDialogContext);

  const { read } = useContext(InspectedElementContext);

  const element =
    inspectedElementID !== null
      ? store.getElementByID(inspectedElementID)
      : null;

  const inspectedElement =
    inspectedElementID != null ? read(inspectedElementID) : null;

  const highlightElement = useCallback(() => {
    if (element !== null && inspectedElementID !== null) {
      const rendererID = store.getRendererIDForElement(inspectedElementID);
      if (rendererID !== null) {
        bridge.send('highlightElementInDOM', {
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
    if (viewElementSource != null && inspectedElementID !== null) {
      viewElementSource(inspectedElementID);
    }
  }, [inspectedElementID, viewElementSource]);

  const canViewSource =
    inspectedElement &&
    inspectedElement.canViewSource &&
    viewElementSource !== null;

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

      // Toggle suspended
      bridge.send('overrideSuspense', {
        id: nearestSuspenseElementID,
        rendererID: store.getRendererIDForElement(nearestSuspenseElementID),
        forceFallback: !isSuspended,
      });
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
            }
          >
            <ButtonIcon type="suspend" />
          </Toggle>
        )}
        <Button
          className={styles.IconButton}
          onClick={highlightElement}
          title="Inspect the matching DOM element"
        >
          <ButtonIcon type="view-dom" />
        </Button>
        <Button
          className={styles.IconButton}
          onClick={logElement}
          title="Log this component data to the console"
        >
          <ButtonIcon type="log-data" />
        </Button>
        <Button
          className={styles.IconButton}
          disabled={!canViewSource}
          onClick={viewSource}
          title="View source for this element"
        >
          <ButtonIcon type="view-source" />
        </Button>
      </div>

      {inspectedElement === null && (
        <div className={styles.Loading}>Loading...</div>
      )}

      {inspectedElement !== null && (
        <InspectedElementView
          element={element}
          inspectedElement={inspectedElement}
        />
      )}
    </div>
  );
}

type InspectedElementViewProps = {|
  element: Element,
  inspectedElement: InspectedElement,
|};

const IS_SUSPENDED = 'Suspended';

function InspectedElementView({
  element,
  inspectedElement,
}: InspectedElementViewProps) {
  const { id, type } = element;
  const {
    canEditFunctionProps,
    canEditHooks,
    canToggleSuspense,
    context,
    hooks,
    owners,
    props,
    state,
  } = inspectedElement;

  const { ownerID } = useContext(TreeStateContext);
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  let overrideContextFn = null;
  let overridePropsFn = null;
  let overrideStateFn = null;
  let overrideSuspenseFn = null;
  if (type === ElementTypeClass) {
    overrideContextFn = (path: Array<string | number>, value: any) => {
      const rendererID = store.getRendererIDForElement(id);
      bridge.send('overrideContext', { id, path, rendererID, value });
    };
    overridePropsFn = (path: Array<string | number>, value: any) => {
      const rendererID = store.getRendererIDForElement(id);
      bridge.send('overrideProps', { id, path, rendererID, value });
    };
    overrideStateFn = (path: Array<string | number>, value: any) => {
      const rendererID = store.getRendererIDForElement(id);
      bridge.send('overrideState', { id, path, rendererID, value });
    };
  } else if (
    (type === ElementTypeFunction ||
      type === ElementTypeMemo ||
      type === ElementTypeForwardRef) &&
    canEditFunctionProps
  ) {
    overridePropsFn = (path: Array<string | number>, value: any) => {
      const rendererID = store.getRendererIDForElement(id);
      bridge.send('overrideProps', { id, path, rendererID, value });
    };
  } else if (type === ElementTypeSuspense && canToggleSuspense) {
    overrideSuspenseFn = (path: Array<string | number>, value: boolean) => {
      if (path.length !== 1 && path !== IS_SUSPENDED) {
        throw new Error('Unexpected path.');
      }
      const rendererID = store.getRendererIDForElement(id);
      bridge.send('overrideSuspense', { id, rendererID, forceFallback: value });
    };
  }

  return (
    <div className={styles.InspectedElement}>
      <InspectedElementTree
        label="props"
        data={props}
        overrideValueFn={overridePropsFn}
        showWhenEmpty
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
          overrideValueFn={overrideStateFn}
        />
      )}
      <HooksTree canEditHooks={canEditHooks} hooks={hooks} id={id} />
      <InspectedElementTree
        label="context"
        data={context}
        overrideValueFn={overrideContextFn}
      />

      {ownerID === null && owners !== null && owners.length > 0 && (
        <div className={styles.Owners}>
          <div className={styles.OwnersHeader}>rendered by</div>
          {owners.map(owner => (
            <OwnerView
              key={owner.id}
              displayName={owner.displayName}
              id={owner.id}
              isInStore={store.containsElement(owner.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type OwnerViewProps = {| displayName: string, id: number, isInStore: boolean |};

function OwnerView({ displayName, id, isInStore }: OwnerViewProps) {
  const dispatch = useContext(TreeDispatcherContext);

  const handleClick = useCallback(
    () =>
      dispatch({
        type: 'SELECT_ELEMENT_BY_ID',
        payload: id,
      }),
    [dispatch, id]
  );

  return (
    <button
      key={id}
      className={`${styles.Owner} ${isInStore ? '' : styles.NotInStore}`}
      disabled={!isInStore}
      onClick={handleClick}
      title={displayName}
    >
      {displayName}
    </button>
  );
}

function CannotSuspendWarningMessage() {
  const store = useContext(StoreContext);
  const areSuspenseElementsHidden = !!store.componentFilters.find(
    filter =>
      filter.type === ComponentFilterElementType &&
      filter.value === ElementTypeSuspense &&
      filter.isEnabled
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
