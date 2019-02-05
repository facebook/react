// @flow

import React, { useContext, useLayoutEffect, useRef, useState } from 'react';
import { SelectedElementContext } from './SelectedElementContext';
import { BridgeContext, StoreContext } from './context';
import ButtonIcon from './ButtonIcon';
import HooksTree from './HooksTree';
import InspectedElementTree from './InspectedElementTree';
import { hydrate } from 'src/hydration';
import styles from './SelectedElement.css';

import type { InspectedElement } from '../types';
import type { DehydratedData } from 'src/devtools/types';
import type { SelectedElementContextValue } from './SelectedElementContext';

export type Props = {||};

export default function SelectedElement(_: Props) {
  const selectedElement = useContext(SelectedElementContext);
  const { id } = selectedElement;
  const store = useContext(StoreContext);
  const element = id !== null ? store.getElementByID(id) : null;

  const inspectedElement = useInspectedElement(id);

  // TODO Make "view DOM" and "view source" buttons work

  if (element === null) {
    return (
      <div className={styles.SelectedElement}>
        <div className={styles.TitleRow} />
      </div>
    );
  }

  const source = inspectedElement ? inspectedElement.source : null;

  return (
    <div className={styles.SelectedElement}>
      <div className={styles.TitleRow}>
        <div className={styles.SelectedComponentName}>
          <div className={styles.Component} title={element.displayName}>
            {element.displayName}
          </div>
        </div>

        <button
          className={styles.IconButton}
          title="Highlight this element in the page"
        >
          <ButtonIcon type="view-dom" />
        </button>
        {source !== null && (
          <button
            className={styles.IconButton}
            title="View source for this element"
          >
            <ButtonIcon type="view-source" />
          </button>
        )}
      </div>

      {inspectedElement === null && (
        <div className={styles.Loading}>Loading...</div>
      )}

      {inspectedElement !== null && (
        <InspectedElementView
          inspectedElement={inspectedElement}
          selectedElement={selectedElement}
        />
      )}
    </div>
  );
}

type InspectedElementViewProps = {|
  inspectedElement: InspectedElement,
  selectedElement: SelectedElementContextValue,
|};

function InspectedElementView({
  inspectedElement,
  selectedElement,
}: InspectedElementViewProps) {
  let { context, hooks, owners, props, state } = inspectedElement;

  return (
    <div className={styles.InspectedElement}>
      <InspectedElementTree label="props" data={props} />
      <InspectedElementTree label="state" data={state} />
      <HooksTree inspectedHooks={hooks} />
      <InspectedElementTree label="context" data={context} />

      {owners !== null && owners.length > 0 && (
        <div className={styles.Owners}>
          <div>owner stack</div>
          {owners.map(owner => (
            <div
              key={owner.id}
              className={styles.Owner}
              onClick={() => {
                selectedElement.id = owner.id;
              }}
              title={owner.displayName}
            >
              {owner.displayName}
            </div>
          ))}
        </div>
      )}
    </div>
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

  const rendererID = id === null ? null : store.getRendererIDForElement(id);

  const [inspectedElement, setInspectedElement] = useState(null);

  // Track the most recently-requested element.
  // We'll ignore any backend updates about previous elements.
  idRef.current = id;

  useLayoutEffect(() => {
    if (id === null) {
      return () => {};
    }

    // Hide previous/stale insepected element to avoid temporarily showing the wrong values.
    setInspectedElement(null);

    let timeoutID = null;

    const sendBridgeRequest = () => {
      bridge.send('inspectElement', { id, rendererID });
    };

    const onInspectedElement = (inspectedElement: InspectedElement) => {
      if (idRef.current !== inspectedElement.id) {
        // Ignore bridge updates about previously selected elements.
        return;
      }

      inspectedElement.context = hydrateHelper(inspectedElement.context);
      inspectedElement.hooks = hydrateHelper(inspectedElement.hooks);
      inspectedElement.props = hydrateHelper(inspectedElement.props);
      inspectedElement.state = hydrateHelper(inspectedElement.state);

      setInspectedElement(inspectedElement);

      // Ask for an update in a second...
      timeoutID = setTimeout(sendBridgeRequest, 1000);
    };

    bridge.addListener('inspectedElement', onInspectedElement);

    sendBridgeRequest();

    return () => {
      if (timeoutID !== null) {
        clearTimeout(timeoutID);
      }

      bridge.removeListener('inspectedElement', onInspectedElement);
    };
  }, [id]);

  return inspectedElement;
}
