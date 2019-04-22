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
import { TreeContext } from './TreeContext';

import type {
  DehydratedData,
  InspectedElement,
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

type Props = {|
  children: React$Node,
|};

function InspectedElementContextController({ children }: Props) {
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);
  const { inspectedElementID } = useContext(TreeContext);

  const [count, setCount] = useState<number>(0);

  const inProgressRequests = useMemo<Map<number, InProgressRequest>>(
    () => new Map(),
    []
  );

  const resource = useMemo<Resource<number, number, InspectedElement>>(
    () =>
      createResource(
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
        (id: number) => id
      ),
    [inProgressRequests]
  );

  // This effect handler invalidates the suspense cache and schedules rendering updates with React.
  useEffect(() => {
    const onInspectedElement = (
      inspectedElementRaw: InspectedElement | null
    ) => {
      if (inspectedElementRaw != null) {
        const id = inspectedElementRaw.id;

        const inspectedElement = (({
          ...inspectedElementRaw,
          context: hydrateHelper(inspectedElementRaw.context),
          hooks: hydrateHelper(inspectedElementRaw.hooks),
          props: hydrateHelper(inspectedElementRaw.props),
          state: hydrateHelper(inspectedElementRaw.state),
        }: any): InspectedElement);

        const request = inProgressRequests.get(id);
        if (request != null) {
          inProgressRequests.delete(id);
          request.resolveFn(inspectedElement);
        } else {
          resource.write(id, inspectedElement);

          // Schedule update with React if the curently-selected element has been invalidated.
          if (id === inspectedElementID) {
            setCount(count => count + 1);
          }
        }
      }
    };

    bridge.addListener('inspectedElement', onInspectedElement);
    return () => bridge.removeListener('inspectedElement', onInspectedElement);
  }, [bridge, inProgressRequests, inspectedElementID, resource]);

  // This effect handler polls for updates on the currently selected element.
  useEffect(() => {
    if (inspectedElementID === null) {
      return () => {};
    }

    const rendererID = store.getRendererIDForElement(inspectedElementID);

    let timeoutID: TimeoutID | null = null;

    const sendRequest = () => {
      timeoutID = null;

      bridge.send('inspectElement', { id: inspectedElementID, rendererID });
    };

    // Send the initial inspection request.
    // We'll poll for an update in the response handler below.
    sendRequest();

    const onInspectedElement = (inspectedElement: InspectedElement | null) => {
      if (
        inspectedElement !== null &&
        inspectedElement.id === inspectedElementID
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
  }, [bridge, inspectedElementID, store]);

  const value = useMemo(
    () => ({
      read: resource.read,
    }),
    // Count is used to invalidate the cache and schedule an update with React.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, resource.read]
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
