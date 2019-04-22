// @flow

import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { TreeDispatcherContext, TreeStateContext } from './TreeContext';
import { BridgeContext, StoreContext } from '../context';
import Button from '../Button';
import ButtonIcon from '../ButtonIcon';
import HooksTree from './HooksTree';
import InspectedElementTree from './InspectedElementTree';
import { hydrate } from 'src/hydration';
import ViewElementSourceContext from './ViewElementSourceContext';
import styles from './SelectedElement.css';
import {
  ElementTypeClass,
  ElementTypeForwardRef,
  ElementTypeFunction,
  ElementTypeMemo,
  ElementTypeSuspense,
} from '../../types';

import type { InspectedElement } from './types';
import type { DehydratedData, Element } from './types';

export type Props = {||};

export default function SelectedElement(_: Props) {
  const { selectedElementID } = useContext(TreeStateContext);
  const viewElementSource = useContext(ViewElementSourceContext);
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  const element =
    selectedElementID !== null ? store.getElementByID(selectedElementID) : null;

  const inspectedElement = useInspectedElement(selectedElementID);

  const highlightElement = useCallback(() => {
    if (element !== null && selectedElementID !== null) {
      const rendererID = store.getRendererIDForElement(selectedElementID);
      if (rendererID !== null) {
        bridge.send('highlightElementInDOM', {
          displayName: element.displayName,
          hideAfterTimeout: true,
          id: selectedElementID,
          openNativeElementsPanel: true,
          rendererID,
          scrollIntoView: true,
        });
      }
    }
  }, [bridge, element, selectedElementID, store]);

  const logElement = useCallback(() => {
    if (selectedElementID !== null) {
      const rendererID = store.getRendererIDForElement(selectedElementID);
      if (rendererID !== null) {
        bridge.send('logElementToConsole', {
          id: selectedElementID,
          rendererID,
        });
      }
    }
  }, [bridge, selectedElementID, store]);

  const viewSource = useCallback(() => {
    if (viewElementSource != null && selectedElementID !== null) {
      viewElementSource(selectedElementID);
    }
  }, [selectedElementID, viewElementSource]);

  if (element === null) {
    return (
      <div className={styles.SelectedElement}>
        <div className={styles.TitleRow} />
      </div>
    );
  }

  const canViewSource =
    inspectedElement &&
    inspectedElement.canViewSource &&
    viewElementSource !== null;

  return (
    <div className={styles.SelectedElement}>
      <div className={styles.TitleRow}>
        <div className={styles.SelectedComponentName}>
          <div className={styles.Component} title={element.displayName}>
            {element.displayName}
          </div>
        </div>

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

  const { ownerStack } = useContext(TreeStateContext);
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

      {ownerStack.length === 0 && owners !== null && owners.length > 0 && (
        <div className={styles.Owners}>
          <div className={styles.OwnersHeader}>rendered by</div>
          {owners.map(owner => (
            <OwnerView
              key={owner.id}
              displayName={owner.displayName}
              id={owner.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OwnerView({ displayName, id }: { displayName: string, id: number }) {
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
      className={styles.Owner}
      onClick={handleClick}
      title={displayName}
    >
      {displayName}
    </button>
  );
}

function hydrateHelper(dehydratedData: DehydratedData | null): Object | null {
  if (dehydratedData !== null) {
    return hydrate(dehydratedData.data, dehydratedData.cleaned);
  } else {
    return null;
  }
}

function useInspectedElement(id: number | null): InspectedElement | null {
  const idRef = useRef(id);
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  const [inspectedElement, setInspectedElement] = useState(null);

  useEffect(() => {
    // Track the current selected element ID.
    // We ignore any backend updates about previously selected elements.
    idRef.current = id;

    // Hide previous/stale insepected element to avoid temporarily showing the wrong values.
    setInspectedElement(null);

    // A null id indicates that there's nothing currently selected in the tree.
    if (id === null) {
      return () => {};
    }

    const rendererID = store.getRendererIDForElement(id);

    // Update the $r variable.
    bridge.send('selectElement', { id, rendererID });

    // Update props, state, and context in the side panel.
    const sendBridgeRequest = () => {
      bridge.send('inspectElement', { id, rendererID });
    };

    let timeoutID = null;

    const onInspectedElement = (inspectedElement: InspectedElement) => {
      if (!inspectedElement || inspectedElement.id !== idRef.current) {
        // Ignore bridge updates about previously selected elements.
        return;
      }

      if (inspectedElement !== null) {
        inspectedElement.context = hydrateHelper(inspectedElement.context);
        inspectedElement.hooks = hydrateHelper(inspectedElement.hooks);
        inspectedElement.props = hydrateHelper(inspectedElement.props);
        inspectedElement.state = hydrateHelper(inspectedElement.state);
      }

      setInspectedElement(inspectedElement);

      // Ask for an update in a second.
      // Make sure we only ask once though.
      clearTimeout(((timeoutID: any): TimeoutID));
      timeoutID = setTimeout(sendBridgeRequest, 1000);
    };

    bridge.addListener('inspectedElement', onInspectedElement);

    sendBridgeRequest();

    return () => {
      bridge.removeListener('inspectedElement', onInspectedElement);

      if (timeoutID !== null) {
        clearTimeout(timeoutID);
      }
    };
  }, [bridge, id, idRef, store]);

  return inspectedElement;
}
