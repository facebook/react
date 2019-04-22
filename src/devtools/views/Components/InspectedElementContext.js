// @flow

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createResource } from '../../cache';
import { BridgeContext, StoreContext } from '../context';
import { hydrate } from 'src/hydration';
import { TreeStateContext } from './TreeContext';

import type {
  DehydratedData,
  InspectedElement,
  InspectedElementResponse,
} from 'src/devtools/views/Components/types';
import type { Resource } from '../../cache';

type Context = {|
  read(id: number): InspectedElement | null,
|};

const InspectedElementContext = createContext<Context>(((null: any): Context));
InspectedElementContext.displayName = 'InspectedElementContext';

type ResolveFn = (inspectedElement: InspectedElement) => void;
type InProgressRequest = {|
  promise: Promise<InspectedElement>,
  resolveFn: ResolveFn,
|};

const inProgressRequests: Map<number, InProgressRequest> = new Map();
const resource: Resource<number, number, InspectedElement> = createResource(
  (id: number) => {
    let request = inProgressRequests.get(id);
    if (request != null) {
      return request.promise;
    }

    let resolveFn = ((null: any): ResolveFn);
    const promise = new Promise(resolve => {
      resolveFn = resolve;
    });

    inProgressRequests.set(id, { promise, resolveFn });

    return promise;
  },
  (id: number) => id,
  { useLRU: true }
);

type Props = {|
  children: React$Node,
|};

function InspectedElementContextController({ children }: Props) {
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);

  // It's very important that this context consumes selectedElementID and not inspectedElementID.
  // Otherwise the effect that sends the "inspect" message across the bridge-
  // would itself be blocked by the same render that suspends (waiting for the data).
  const { selectedElementID } = useContext(TreeStateContext);

  const [count, setCount] = useState<number>(0);

  // This effect handler invalidates the suspense cache and schedules rendering updates with React.
  useEffect(() => {
    const onInspectedElement = (
      inspectedElementResponse: InspectedElementResponse | null
    ) => {
      if (inspectedElementResponse != null) {
        let { inspectedElement } = inspectedElementResponse;
        if (inspectedElement !== null) {
          const id = inspectedElement.id;

          inspectedElement = (({
            ...inspectedElement,
            context: hydrateHelper(inspectedElement.context),
            hooks: hydrateHelper(inspectedElement.hooks),
            props: hydrateHelper(inspectedElement.props),
            state: hydrateHelper(inspectedElement.state),
          }: any): InspectedElement);

          const request = inProgressRequests.get(id);
          if (request != null) {
            inProgressRequests.delete(id);
            request.resolveFn(inspectedElement);
          } else {
            resource.write(id, inspectedElement);

            // Schedule update with React if the curently-selected element has been invalidated.
            if (id === selectedElementID) {
              setCount(count => count + 1);
            }
          }
        }
      }
    };

    bridge.addListener('inspectedElement', onInspectedElement);
    return () => bridge.removeListener('inspectedElement', onInspectedElement);
  }, [bridge, selectedElementID]);

  // This effect handler polls for updates on the currently selected element.
  useEffect(() => {
    if (selectedElementID === null) {
      return () => {};
    }

    const rendererID = store.getRendererIDForElement(selectedElementID);

    let timeoutID: TimeoutID | null = null;

    const sendRequest = () => {
      timeoutID = null;

      bridge.send('inspectElement', { id: selectedElementID, rendererID });
    };

    // Send the initial inspection request.
    // We'll poll for an update in the response handler below.
    sendRequest();

    const onInspectedElement = (
      inspectedElementResponse: InspectedElementResponse | null
    ) => {
      if (
        inspectedElementResponse !== null &&
        inspectedElementResponse.id === selectedElementID
      ) {
        // If this is the element we requested, wait a little bit and then ask for an update.
        timeoutID = setTimeout(sendRequest, 1000);
      }
    };

    bridge.addListener('inspectedElement', onInspectedElement);

    return () => {
      bridge.removeListener('inspectedElement', onInspectedElement);

      if (timeoutID !== null) {
        clearTimeout(timeoutID);
      }
    };
  }, [bridge, selectedElementID, store]);

  const value = useMemo(
    () => ({
      read: resource.read,
    }),
    // Count is used to invalidate the cache and schedule an update with React.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count]
  );

  return (
    <InspectedElementContext.Provider value={value}>
      {children}
    </InspectedElementContext.Provider>
  );
}

function hydrateHelper(dehydratedData: DehydratedData | null): Object | null {
  if (dehydratedData !== null) {
    return hydrate(dehydratedData.data, dehydratedData.cleaned);
  } else {
    return null;
  }
}

export { InspectedElementContext, InspectedElementContextController };
