// @flow

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
} from 'react';
import { createResource } from '../../cache';
import { BridgeContext, StoreContext } from '../context';
import { TreeStateContext } from './TreeContext';

import type {
  Element,
  Owner,
  OwnersList,
} from 'src/devtools/views/Components/types';
import type { Resource, Thenable } from '../../cache';

type Context = (id: number) => Array<Owner> | null;

const OwnersListContext = createContext<Context>(((null: any): Context));
OwnersListContext.displayName = 'OwnersListContext';

type ResolveFn = (ownersList: Array<Owner> | null) => void;
type InProgressRequest = {|
  promise: Thenable<Array<Owner>>,
  resolveFn: ResolveFn,
|};

const inProgressRequests: WeakMap<Element, InProgressRequest> = new WeakMap();
const resource: Resource<Element, Element, Array<Owner>> = createResource(
  (element: Element) => {
    let request = inProgressRequests.get(element);
    if (request != null) {
      return request.promise;
    }

    let resolveFn = ((null: any): ResolveFn);
    const promise = new Promise(resolve => {
      resolveFn = resolve;
    });

    inProgressRequests.set(element, { promise, resolveFn });

    return promise;
  },
  (element: Element) => element,
  { useWeakMap: true }
);

type Props = {|
  children: React$Node,
|};

function OwnersListContextController({ children }: Props) {
  const bridge = useContext(BridgeContext);
  const store = useContext(StoreContext);
  const { ownerID } = useContext(TreeStateContext);

  const read = useCallback(
    (id: number) => {
      const element = store.getElementByID(id);
      if (element !== null) {
        return resource.read(element);
      } else {
        return null;
      }
    },
    [store]
  );

  useEffect(() => {
    const onOwnersList = (ownersList: OwnersList) => {
      const id = ownersList.id;

      const element = store.getElementByID(id);
      if (element !== null) {
        const request = inProgressRequests.get(element);
        if (request != null) {
          inProgressRequests.delete(element);
          request.resolveFn(ownersList.owners);
        }
      }
    };

    bridge.addListener('ownersList', onOwnersList);
    return () => bridge.removeListener('ownersList', onOwnersList);
  }, [bridge, store]);

  // This effect requests an updated owners list any time the selected owner changes
  useEffect(() => {
    if (ownerID !== null) {
      const rendererID = store.getRendererIDForElement(ownerID);

      bridge.send('getOwnersList', { id: ownerID, rendererID });
    }

    return () => {};
  }, [bridge, ownerID, store]);

  return (
    <OwnersListContext.Provider value={read}>
      {children}
    </OwnersListContext.Provider>
  );
}

export { OwnersListContext, OwnersListContextController };
