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
import { unstable_next as next } from 'scheduler';
import { TreeContext } from './TreeContext';

import type {
  DehydratedData,
  InspectedElement,
} from 'src/devtools/views/Components/types';
import type { Resource } from '../../cache';

// TODO This isn't using the "two setState" pattern and updates sometimes feel janky.

type Context = {|
  inspectedElementID: number | null,
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

  const { selectedElementID } = useContext(TreeContext);
  const [inspectedElement, setInspectedElement] = useState<{
    id: number | null,
    inspectedElement: InspectedElement | null,
  }>({
    id: selectedElementID,
    inspectedElement: null,
  });
  if (inspectedElement.id !== selectedElementID) {
    if (selectedElementID === null) {
      setInspectedElement({
        id: selectedElementID,
        inspectedElement: null,
      });
    } else {
      next(() =>
        setInspectedElement({
          id: selectedElementID,
          inspectedElement: null,
        })
      );
    }
  }

  useEffect(() => {
    if (inspectedElement.id === null) {
      return () => {};
    }

    const rendererID = store.getRendererIDForElement(inspectedElement.id);

    const requestUpdate = () => {
      bridge.send('inspectElement', { id: inspectedElement.id, rendererID });
    };

    requestUpdate();

    const intervalID = setInterval(requestUpdate, 1000);

    return () => clearInterval(intervalID);
  }, [bridge, inspectedElement.id, store]);

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

          // Schedule update with React if necessary.
          setInspectedElement(prevState =>
            prevState.id === id ? { id, inspectedElement } : prevState
          );
        }
      }
    };

    bridge.addListener('inspectedElement', onInspectedElement);
    return () => bridge.removeListener('inspectElement', onInspectedElement);
  }, [bridge, inProgressRequests, resource]);

  // We intentionally use the broader inspectedElement object, rather than the id,
  // to enable updates to be scheduled with React after the cache has been invalidated.
  const value = useMemo(
    () => ({
      inspectedElementID: inspectedElement.id,
      read: resource.read,
    }),
    [inspectedElement, resource.read]
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
