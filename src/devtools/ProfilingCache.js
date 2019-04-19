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
  getChartData as getInteractionsChartData,
  invalidateChartData as invalidateInteractionsChartData,
} from 'src/devtools/views/Profiler/InteractionsChartBuilder';
import {
  getChartData as getRankedChartData,
  invalidateChartData as invalidateRankedChartData,
} from 'src/devtools/views/Profiler/RankedChartBuilder';

import type { Resource } from './cache';
import type { Bridge } from '../types';
import type {
  CommitDetails as CommitDetailsBackend,
  FiberCommits as FiberCommitsBackend,
  Interactions as InteractionsBackend,
  ProfilingSummary as ProfilingSummaryBackend,
} from 'src/backend/types';
import type {
  CommitDetails as CommitDetailsFrontend,
  FiberCommits as FiberCommitsFrontend,
  Interactions as InteractionsFrontend,
  InteractionWithCommits,
  CommitTree as CommitTreeFrontend,
  ProfilingSummary as ProfilingSummaryFrontend,
} from 'src/devtools/views/Profiler/types';
import type { ChartData as FlamegraphChartData } from 'src/devtools/views/Profiler/FlamegraphChartBuilder';
import type { ChartData as InteractionsChartData } from 'src/devtools/views/Profiler/InteractionsChartBuilder';
import type { ChartData as RankedChartData } from 'src/devtools/views/Profiler/RankedChartBuilder';

type CommitDetailsParams = {|
  commitIndex: number,
  rendererID: number,
  rootID: number,
|};

type FiberCommitsParams = {|
  fiberID: number,
  rendererID: number,
  rootID: number,
|};

type InteractionsParams = {|
  rendererID: number,
  rootID: number,
|};

type GetCommitTreeParams = {|
  commitIndex: number,
  profilingSummary: ProfilingSummaryFrontend,
|};

type ProfilingSummaryParams = {|
  rendererID: number,
  rootID: number,
|};

export default class ProfilingCache {
  _bridge: Bridge;
  _store: Store;

  _pendingCommitDetailsMap: Map<
    string,
    (commitDetails: CommitDetailsFrontend) => void
  > = new Map();

  _pendingFiberCommitsMap: Map<
    string,
    (fiberCommits: FiberCommitsFrontend) => void
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
    string,
    CommitDetailsFrontend
  > = createResource(
    ({ commitIndex, rendererID, rootID }: CommitDetailsParams) => {
      return new Promise(resolve => {
        const importedProfilingData = this._store.importedProfilingData;
        if (importedProfilingData !== null) {
          const { commitDetails } = (importedProfilingData: any);
          if (commitDetails != null && commitIndex < commitDetails.length) {
            const response = commitDetails[commitIndex];
            this._pendingCommitDetailsMap.set(
              `${response.rootID}-${commitIndex}`,
              resolve
            );
            this.onCommitDetails(response);
            return;
          }
        } else if (this._store.profilingOperations.has(rootID)) {
          this._pendingCommitDetailsMap.set(
            `${rootID}-${commitIndex}`,
            resolve
          );
          this._bridge.send('getCommitDetails', {
            commitIndex,
            rendererID,
            rootID,
          });
          return;
        }

        // If no profiling data was recorded for this root, skip the round trip.
        resolve({
          rootID,
          commitIndex,
          actualDurations: new Map(),
          interactions: [],
        });
      });
    },
    ({ commitIndex, rendererID, rootID }: CommitDetailsParams) =>
      `${rootID}-${commitIndex}`
  );

  FiberCommits: Resource<
    FiberCommitsParams,
    string,
    FiberCommitsFrontend
  > = createResource(
    ({ fiberID, rendererID, rootID }: FiberCommitsParams) => {
      return new Promise(resolve => {
        const importedProfilingData = this._store.importedProfilingData;
        if (importedProfilingData !== null) {
          // TODO (profiling) commit details
          // Copy from renderer getFiberCommits()
        } else if (this._store.profilingOperations.has(rootID)) {
          this._pendingFiberCommitsMap.set(`${rootID}-${fiberID}`, resolve);
          this._bridge.send('getFiberCommits', {
            fiberID,
            rendererID,
            rootID,
          });
          return;
        }

        // If no profiling data was recorded for this root, skip the round trip.
        resolve({
          commitDurations: [],
          fiberID,
          rootID,
        });
      });
    },
    ({ fiberID, rendererID, rootID }: FiberCommitsParams) =>
      `${rootID}-${fiberID}`
  );

  Interactions: Resource<
    InteractionsParams,
    number,
    InteractionsFrontend
  > = createResource(
    ({ rendererID, rootID }: InteractionsParams) => {
      return new Promise(resolve => {
        const importedProfilingData = this._store.importedProfilingData;
        if (importedProfilingData !== null) {
          const { interactions } = (importedProfilingData: any);
          if (interactions != null) {
            this._pendingInteractionsMap.set(interactions.rootID, resolve);
            this.onInteractions(interactions);
            return;
          }
        } else if (this._store.profilingOperations.has(rootID)) {
          this._pendingInteractionsMap.set(rootID, resolve);
          this._bridge.send('getInteractions', {
            rendererID,
            rootID,
          });
          return;
        }

        // If no profiling data was recorded for this root, skip the round trip.
        resolve([]);
      });
    },
    ({ rendererID, rootID }: ProfilingSummaryParams) => rootID
  );

  ProfilingSummary: Resource<
    ProfilingSummaryParams,
    number,
    ProfilingSummaryFrontend
  > = createResource(
    ({ rendererID, rootID }: ProfilingSummaryParams) => {
      return new Promise(resolve => {
        const importedProfilingData = this._store.importedProfilingData;
        if (importedProfilingData !== null) {
          const { profilingSummary } = (importedProfilingData: any);
          if (profilingSummary != null) {
            this._pendingProfileSummaryMap.set(
              profilingSummary.rootID,
              resolve
            );
            this.onProfileSummary(profilingSummary);
            return;
          }
        } else if (this._store.profilingOperations.has(rootID)) {
          this._pendingProfileSummaryMap.set(rootID, resolve);
          this._bridge.send('getProfilingSummary', { rendererID, rootID });
          return;
        }

        // If no profiling data was recorded for this root, skip the round trip.
        resolve({
          rootID,
          commitDurations: [],
          commitTimes: [],
          initialTreeBaseDurations: new Map(),
          interactionCount: 0,
        });
      });
    },
    ({ rendererID, rootID }: ProfilingSummaryParams) => rootID
  );

  constructor(bridge: Bridge, store: Store) {
    this._bridge = bridge;
    this._store = store;

    bridge.addListener('commitDetails', this.onCommitDetails);
    bridge.addListener('fiberCommits', this.onFiberCommits);
    bridge.addListener('interactions', this.onInteractions);
    bridge.addListener('profilingSummary', this.onProfileSummary);
  }

  getCommitTree = ({ commitIndex, profilingSummary }: GetCommitTreeParams) =>
    getCommitTree({
      commitIndex,
      profilingSummary,
      store: this._store,
    });

  getFlamegraphChartData = ({
    commitDetails,
    commitIndex,
    commitTree,
  }: {|
    commitDetails: CommitDetailsFrontend,
    commitIndex: number,
    commitTree: CommitTreeFrontend,
  |}): FlamegraphChartData =>
    getFlamegraphChartData({
      commitDetails,
      commitIndex,
      commitTree,
    });

  getInteractionsChartData = ({
    interactions,
    profilingSummary,
    rootID,
  }: {|
    interactions: Array<InteractionWithCommits>,
    profilingSummary: ProfilingSummaryFrontend,
  |}): InteractionsChartData =>
    getInteractionsChartData({
      interactions,
      profilingSummary,
    });

  getRankedChartData = ({
    commitDetails,
    commitIndex,
    commitTree,
  }: {|
    commitDetails: CommitDetailsFrontend,
    commitIndex: number,
    commitTree: CommitTreeFrontend,
  |}): RankedChartData =>
    getRankedChartData({
      commitDetails,
      commitIndex,
      commitTree,
    });

  invalidate() {
    // Invalidate Susepnse caches.
    invalidateResources();

    // Invalidate non-Suspense caches too.
    invalidateCommitTrees();
    invalidateFlamegraphChartData();
    invalidateInteractionsChartData();
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
        rootID,
        commitIndex,
        actualDurations: actualDurationsMap,
        interactions,
      });
    }
  };

  onFiberCommits = ({
    commitDurations,
    fiberID,
    rootID,
  }: FiberCommitsBackend) => {
    const key = `${rootID}-${fiberID}`;
    const resolve = this._pendingFiberCommitsMap.get(key);
    if (resolve != null) {
      this._pendingFiberCommitsMap.delete(key);

      resolve({
        commitDurations,
        fiberID,
        rootID,
      });
    }
  };

  onInteractions = ({ interactions, rootID }: InteractionsBackend) => {
    const resolve = this._pendingInteractionsMap.get(rootID);
    if (resolve != null) {
      this._pendingInteractionsMap.delete(rootID);

      resolve(interactions);
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
        rootID,
        commitDurations,
        commitTimes,
        initialTreeBaseDurations: initialTreeBaseDurationsMap,
        interactionCount,
      });
    }
  };
}
