// @flow

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createResource } from '../../cache';
import { BridgeContext, StoreContext } from '../context';
import { hydrate } from 'src/hydration';

import type {
  DehydratedData,
  InspectedElement,
} from 'src/devtools/views/Components/types';
import type { Resource } from '../../cache';

// TODO Something needs to poll for (unprompted) updates.

// TODO The curretn approach caches resources permanently.
// We won't even ask for an update if an element is reselected.
// I think we need to separate the polling for an update from the suspense cache.
// This way we can always resened (and poll on an interval) for the selected id,
// and the cache here can just invalidate itself as responses stream in.

type Params = {|
  id: number,
  rendererID: number,
|};

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

  const [count, setCount] = useState(0);

  const inProgressRequests = useMemo<Map<number, InProgressRequest>>(
    () => new Map(),
    []
  );

  const resource = useMemo<Resource<Params, number, InspectedElement>>(
    () =>
      createResource(
        ({ id, rendererID }: Params) => {
          let request = inProgressRequests.get(id);
          if (request != null) {
            return request.promise;
          }

          let resolveFn = ((null: any): ResolveFn);
          const promise = new Promise(resolve => {
            resolveFn = resolve;

            bridge.send('inspectElement', { id, rendererID });
          });

          inProgressRequests.set(id, { promise, resolveFn });

          return promise;
        },
        ({ id, rendererID }: Params) => id
      ),
    [bridge, inProgressRequests]
  );

  useEffect(() => {
    const onInspectedElement = (inspectedElement: InspectedElement | null) => {
      if (inspectedElement != null) {
        const id = inspectedElement.id;

        inspectedElement.context = hydrateHelper(inspectedElement.context);
        inspectedElement.hooks = hydrateHelper(inspectedElement.hooks);
        inspectedElement.props = hydrateHelper(inspectedElement.props);
        inspectedElement.state = hydrateHelper(inspectedElement.state);

        const request = inProgressRequests.get(id);
        if (request != null) {
          inProgressRequests.delete(id);
          request.resolveFn(inspectedElement);
        } else {
          resource.write(id, inspectedElement);

          // Schedule update with React.
          setCount(count => count + 1);
        }
      }
    };

    bridge.addListener('inspectedElement', onInspectedElement);
    return () => bridge.removeListener('inspectElement', onInspectedElement);
  }, [bridge, inProgressRequests, resource]);

  const read = useCallback(
    (id: number) => {
      const rendererID = store.getRendererIDForElement(id);
      if (rendererID != null) {
        return resource.read({ id, rendererID });
      } else {
        return null;
      }
    },
    [resource, store]
  );

  // "count" is intentionally passed so that it recreates the memoized object.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => ({ read }), [count, read]);

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
