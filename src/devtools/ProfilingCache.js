// @flow

import { createResource, invalidateResources } from './cache';
import Store from './store';

import type { Resource } from './cache';
import type { Bridge } from '../types';
import type { ProfilingSummary as ProfilingSummaryBackend } from 'src/backend/types';
import type { ProfilingSummary as ProfilingSummaryFrontend } from 'src/devtools/views/Profiler/types';

type AAA = {|
  rootID: number,
  rendererID: number,
|};

export default class ProfilingCache {
  _pendingProfileSummaryMap: Map<
    number,
    (profilingSummary: ProfilingSummaryFrontend) => void
  > = new Map();

  ProfilingSummary: Resource<AAA, ProfilingSummaryFrontend>;

  // TODO (profiling) renderer + root

  constructor(bridge: Bridge, store: Store) {
    this.ProfilingSummary = createResource(
      ({ rendererID, rootID }: AAA) => {
        return new Promise(resolve => {
          if (!store._profilingOperations.has(rootID)) {
            // If no profiling data was recorded for this root, skip the round trip.
            resolve({
              commits: [],
              initialTreeBaseDurations: new Map(),
              interactionCount: 0,
            });
          } else {
            this._pendingProfileSummaryMap.set(rootID, resolve);
            bridge.send('getProfilingSummary', { rendererID, rootID });
          }
        });
      },
      ({ rendererID, rootID }: AAA) => rootID
    );

    bridge.addListener('profilingSummary', this.onProfileSummary);
  }

  invalidate() {
    invalidateResources();
    this._pendingProfileSummaryMap = new Map();
  }

  onProfileSummary = ({
    commits,
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
        commits,
        initialTreeBaseDurations: initialTreeBaseDurationsMap,
        interactionCount,
      });
    }
  };
}
