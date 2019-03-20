// @flow

import { createResource, invalidateResources } from './cache';
import Store from './store';
import {
  getCommitTree,
  invalidateCommitTrees,
} from 'src/devtools/views/Profiler/CommitTreeBuilder';
import {
  getChartData as getFlamegraphChartData,
  invalidateChartData as invalidateFlamegraphChartData,
} from 'src/devtools/views/Profiler/FlamegraphChartBuilder';
import {
  getChartData as getRankedChartData,
  invalidateChartData as invalidateRankedChartData,
} from 'src/devtools/views/Profiler/RankedChartBuilder';

import type { Resource } from './cache';
import type { Bridge } from '../types';
import type {
  CommitDetails as CommitDetailsBackend,
  Interactions as InteractionsBackend,
  ProfilingSummary as ProfilingSummaryBackend,
} from 'src/backend/types';
import type {
  CommitDetails as CommitDetailsFrontend,
  Interactions as InteractionsFrontend,
  CommitTree as CommitTreeFrontend,
  ProfilingSummary as ProfilingSummaryFrontend,
} from 'src/devtools/views/Profiler/types';
import type { ChartData as FlamegraphChartData } from 'src/devtools/views/Profiler/FlamegraphChartBuilder';
import type { ChartData as RankedChartData } from 'src/devtools/views/Profiler/RankedChartBuilder';

type CommitDetailsParams = {|
  commitIndex: number,
  rootID: number,
  rendererID: number,
|};

type InteractionsParams = {|
  rootID: number,
  rendererID: number,
|};

type GetCommitTreeParams = {|
  commitIndex: number,
  profilingSummary: ProfilingSummaryFrontend,
  rendererID: number,
  rootID: number,
|};

type ProfilingSummaryParams = {|
  rootID: number,
  rendererID: number,
|};

export default class ProfilingCache {
  _bridge: Bridge;
  _store: Store;

  _pendingCommitDetailsMap: Map<
    string,
    (commitDetails: CommitDetailsFrontend) => void
  > = new Map();

  _pendingInteractionsMap: Map<
    number,
    (interactions: InteractionsFrontend) => void
  > = new Map();

  _pendingProfileSummaryMap: Map<
    number,
    (profilingSummary: ProfilingSummaryFrontend) => void
  > = new Map();

  CommitDetails: Resource<
    CommitDetailsParams,
    CommitDetailsFrontend
  > = createResource(
    ({ commitIndex, rendererID, rootID }: CommitDetailsParams) => {
      return new Promise(resolve => {
        if (!this._store.profilingOperations.has(rootID)) {
          // If no profiling data was recorded for this root, skip the round trip.
          resolve({
            actualDurations: new Map(),
            interactions: [],
          });
        } else {
          this._pendingCommitDetailsMap.set(
            `${rootID}-${commitIndex}`,
            resolve
          );
          this._bridge.send('getCommitDetails', {
            commitIndex,
            rendererID,
            rootID,
          });
        }
      });
    },
    ({ commitIndex, rendererID, rootID }: CommitDetailsParams) =>
      `${rootID}-${commitIndex}`
  );

  Interactions: Resource<
    InteractionsParams,
    InteractionsFrontend
  > = createResource(
    ({ rendererID, rootID }: InteractionsParams) => {
      return new Promise(resolve => {
        if (!this._store.profilingOperations.has(rootID)) {
          // If no profiling data was recorded for this root, skip the round trip.
          resolve({
            interactions: [],
            rootID,
          });
        } else {
          this._pendingInteractionsMap.set(rootID, resolve);
          this._bridge.send('getInteractions', {
            rendererID,
            rootID,
          });
        }
      });
    },
    ({ rendererID, rootID }: ProfilingSummaryParams) => rootID
  );

  ProfilingSummary: Resource<
    ProfilingSummaryParams,
    ProfilingSummaryFrontend
  > = createResource(
    ({ rendererID, rootID }: ProfilingSummaryParams) => {
      return new Promise(resolve => {
        if (!this._store.profilingOperations.has(rootID)) {
          // If no profiling data was recorded for this root, skip the round trip.
          resolve({
            commitDurations: [],
            commitTimes: [],
            initialTreeBaseDurations: new Map(),
            interactionCount: 0,
          });
        } else {
          this._pendingProfileSummaryMap.set(rootID, resolve);
          this._bridge.send('getProfilingSummary', { rendererID, rootID });
        }
      });
    },
    ({ rendererID, rootID }: ProfilingSummaryParams) => rootID
  );

  constructor(bridge: Bridge, store: Store) {
    this._bridge = bridge;
    this._store = store;

    bridge.addListener('commitDetails', this.onCommitDetails);
    bridge.addListener('interactions', this.onInteractions);
    bridge.addListener('profilingSummary', this.onProfileSummary);
  }

  getCommitTree = ({
    commitIndex,
    profilingSummary,
    rendererID,
    rootID,
  }: GetCommitTreeParams) =>
    getCommitTree({
      commitIndex,
      profilingSummary,
      rendererID,
      rootID,
      store: this._store,
    });

  getFlamegraphChartData = ({
    commitDetails,
    commitIndex,
    commitTree,
    rootID,
  }: {|
    commitDetails: CommitDetailsFrontend,
    commitIndex: number,
    commitTree: CommitTreeFrontend,
    rootID: number,
  |}): FlamegraphChartData =>
    getFlamegraphChartData({
      commitDetails,
      commitIndex,
      commitTree,
      rootID,
    });

  getRankedChartData = ({
    commitDetails,
    commitIndex,
    commitTree,
    rootID,
  }: {|
    commitDetails: CommitDetailsFrontend,
    commitIndex: number,
    commitTree: CommitTreeFrontend,
    rootID: number,
  |}): RankedChartData =>
    getRankedChartData({
      commitDetails,
      commitIndex,
      commitTree,
      rootID,
    });

  invalidate() {
    // Invalidate Susepnse caches.
    invalidateResources();

    // Invalidate non-Suspense caches too.
    invalidateCommitTrees();
    invalidateFlamegraphChartData();
    invalidateRankedChartData();

    this._pendingCommitDetailsMap.clear();
    this._pendingProfileSummaryMap.clear();
  }

  onCommitDetails = ({
    commitIndex,
    actualDurations,
    interactions,
    rootID,
  }: CommitDetailsBackend) => {
    const key = `${rootID}-${commitIndex}`;
    const resolve = this._pendingCommitDetailsMap.get(key);
    if (resolve != null) {
      this._pendingCommitDetailsMap.delete(key);

      const actualDurationsMap = new Map();
      for (let i = 0; i < actualDurations.length; i += 2) {
        actualDurationsMap.set(actualDurations[i], actualDurations[i + 1]);
      }

      resolve({
        actualDurations: actualDurationsMap,
        interactions,
      });
    }
  };

  onInteractions = ({ interactions, rootID }: InteractionsBackend) => {
    const resolve = this._pendingInteractionsMap.get(rootID);
    if (resolve != null) {
      this._pendingInteractionsMap.delete(rootID);

      resolve({
        interactions,
        rootID,
      });
    }
  };

  onProfileSummary = ({
    commitDurations,
    commitTimes,
    initialTreeBaseDurations,
    interactionCount,
    rootID,
  }: ProfilingSummaryBackend) => {
    const resolve = this._pendingProfileSummaryMap.get(rootID);
    if (resolve != null) {
      this._pendingProfileSummaryMap.delete(rootID);
      const initialTreeBaseDurationsMap = new Map();
      for (let i = 0; i < initialTreeBaseDurations.length; i += 2) {
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
