// @flow

import EventEmitter from 'events';
import { createResource } from './cache';
import Store from './store';
import { hydrate } from 'src/hydration';

import type {
  DehydratedData,
  InspectedElement,
} from 'src/devtools/views/Components/types';
import type { Resource } from './cache';
import type { Bridge } from '../types';

type ResolveFn = (inspectedElement: InspectedElement) => void;

type Params = {|
  id: number,
  rendererID: number,
|};

// TODO Use an LRU for the underlying caching mechanism, to prevent memory leaks.

// TODO Something needs to poll for (unprompted) updates.

export default class InspectedElementCache extends EventEmitter {
  _bridge: Bridge;
  _store: Store;

  _pendingRequests: Map<number, ResolveFn> = new Map();

  _resource: Resource<Params, number, InspectedElement> = createResource(
    ({ id, rendererID }: Params) => {
      return new Promise(resolve => {
        this._pendingRequests.set(id, resolve);
        this._bridge.send('inspectElement', {
          id,
          rendererID,
        });
      });
    },
    ({ id, rendererID }: Params) => id
  );

  constructor(bridge: Bridge, store: Store) {
    super();

    this._bridge = bridge;
    this._store = store;

    bridge.addListener('inspectedElement', this._onInspectedElement);
  }

  read(id: number): InspectedElement | null {
    const rendererID = this._store.getRendererIDForElement(id);

    if (rendererID != null) {
      return this._resource.read({ id, rendererID });
    } else {
      return null;
    }
  }

  _onInspectedElement = (inspectedElement: InspectedElement) => {
    const id = inspectedElement.id;

    if (inspectedElement != null) {
      inspectedElement.context = hydrateHelper(inspectedElement.context);
      inspectedElement.hooks = hydrateHelper(inspectedElement.hooks);
      inspectedElement.props = hydrateHelper(inspectedElement.props);
      inspectedElement.state = hydrateHelper(inspectedElement.state);
    }

    const resolveFn = this._pendingRequests.get(id);
    if (resolveFn != null) {
      this._pendingRequests.delete(id);

      resolveFn(inspectedElement);
    } else {
      this._resource.write(id, inspectedElement);

      this.emit('invalidated', id);
    }
  };
}

function hydrateHelper(dehydratedData: DehydratedData | null): Object | null {
  if (dehydratedData !== null) {
    return hydrate(dehydratedData.data, dehydratedData.cleaned);
  } else {
    return null;
  }
}
