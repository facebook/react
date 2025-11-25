/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Lanes} from './ReactFiberLane';
import type {ReactExternalDataSource} from 'shared/ReactTypes';

import {includesTransitionLane} from './ReactFiberLane';
import ReactSharedInternals from 'shared/ReactSharedInternals';
import is from 'shared/objectIs';

// Wraps/subscribes to a store and tracks its state(s) for a given React root.
export class StoreWrapper<S, A> {
  _committedState: S;
  _headState: S;
  _unsubscribe: () => void;
  store: ReactExternalDataSource<S, A>;
  constructor(store: ReactExternalDataSource<S, A>) {
    this._headState = this._committedState = store.getState();
    this._unsubscribe = store.subscribe(action => {
      this.handleUpdate(action);
    });
    this.store = store;
  }
  handleUpdate(action: A) {
    const transitionState = this._headState;
    const currentState = this._committedState;
    this._headState = this.store.getState();

    if (ReactSharedInternals.T !== null) {
      // We are in a transition, update the transition state only
    } else if (is(transitionState, currentState)) {
      // We are updating sync and no transition is in progress, update both
      this._committedState = this._headState;
    } else {
      // We are updating sync, but a transition is in progress. Implement
      // React's update reordering semantics.
      this._committedState = this.store.reducer(this._committedState, action);
    }
  }
  getStateForLanes(lanes: Lanes): S {
    const isTransition = includesTransitionLane(lanes);
    return isTransition ? this._headState : this._committedState;
  }
  subscribe(callback: () => void): () => void {
    // TODO: Have our own subscription mechanism such that fibers subscribe to the wrapper
    // and the wrapper can subscribe to the store.
    return this.store.subscribe(callback);
  }
  commitFinished(lanes: Lanes) {
    this._committedState = this.getStateForLanes(lanes);
  }
  dispose() {
    this._unsubscribe();
  }
}

type StoreWrapperInfo<S, A> = {
  wrapper: StoreWrapper<S, A>,
  references: number,
};

// Used by a React root to track the stores referenced by its fibers.
export class StoreTracker {
  stores: Map<ReactExternalDataSource<any, any>, StoreWrapperInfo<any, any>>;

  constructor() {
    this.stores = new Map();
  }

  commitFinished(lanes: Lanes) {
    this.stores.forEach(({wrapper}) => {
      wrapper.commitFinished(lanes);
    });
  }

  getWrapper<S, A>(store: ReactExternalDataSource<S, A>): StoreWrapper<S, A> {
    const info = this.stores.get(store);
    if (info !== undefined) {
      info.references++;
      return info.wrapper;
    }
    const wrapper = new StoreWrapper<S, A>(store);
    this.stores.set(store, {references: 1, wrapper});
    return wrapper;
  }

  remove<S, A>(store: ReactExternalDataSource<S, A>): void {
    const info = this.stores.get(store);
    if (info !== undefined) {
      info.references--;
      if (info.references === 0) {
        info.wrapper.dispose();
        this.stores.delete(store);
      }
    }
  }
}
