// @flow

import { createResource, invalidateResources } from './cache';
import Store from './store';

import type { Resource } from './cache';
import type { Bridge } from '../types';
import type { ProfilingSummary as ProfilingSummaryBackend } from 'src/backend/types';
import type { ProfilingSummary as ProfilingSummaryFrontend } from 'src/devtools/views/Profiler/types';

type RendererAndRootID = {|
  rootID: number,
  rendererID: number,
|};

export default class ProfilingCache {
  _pendingProfileSummaryMap: Map<
    number,
    (profilingSummary: ProfilingSummaryFrontend) => void
  > = new Map();

  ProfilingSummary: Resource<RendererAndRootID, ProfilingSummaryFrontend>;

  constructor(bridge: Bridge, store: Store) {
    this.ProfilingSummary = createResource(
      ({ rendererID, rootID }: RendererAndRootID) => {
        return new Promise(resolve => {
          if (!store._profilingOperations.has(rootID)) {
            // If no profiling data was recorded for this root, skip the round trip.
            resolve({
              commitDurations: [],
              commitTimes: [],
              initialTreeBaseDurations: new Map(),
              interactionCount: 0,
            });
          } else {
            this._pendingProfileSummaryMap.set(rootID, resolve);
            bridge.send('getProfilingSummary', { rendererID, rootID });
          }
        });
      },
      ({ rendererID, rootID }: RendererAndRootID) => rootID
    );

    bridge.addListener('profilingSummary', this.onProfileSummary);
  }

  invalidate() {
    invalidateResources();
    this._pendingProfileSummaryMap = new Map();
  }

  onProfileSummary = ({
    commitDurations,
    commitTimes,
    initialTreeBaseDurations,
    interactionCount,
    rootID,
  }: ProfilingSummaryBackend) => {
    const resolve = this._pendingProfileSummaryMap.get(rootID);
    if (resolve != null) {
      const initialTreeBaseDurationsMap = new Map();
      for (let i = 0; i < initialTreeBaseDurations.length; i++) {
        initialTreeBaseDurationsMap.set(
          initialTreeBaseDurations[i],
          initialTreeBaseDurations[i + 1]
        );
      }

      resolve({
        commitDurations,
        commitTimes,
        initialTreeBaseDurations: initialTreeBaseDurationsMap,
        interactionCount,
      });
    }
  };
}
