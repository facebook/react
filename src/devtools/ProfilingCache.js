// @flow

import { createResource } from './cache';
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
import type {
  CommitDetailsBackend,
  FiberCommitsBackend,
  InteractionsBackend,
  ProfilingSummaryBackend,
} from 'src/backend/types';
import type {
  CommitDetailsFrontend,
  FiberCommitsFrontend,
  InteractionsFrontend,
  InteractionWithCommitsFrontend,
  CommitTreeFrontend,
  ProfilingSummaryFrontend,
} from 'src/devtools/views/Profiler/types';
import type { ChartData as FlamegraphChartData } from 'src/devtools/views/Profiler/FlamegraphChartBuilder';
import type { ChartData as InteractionsChartData } from 'src/devtools/views/Profiler/InteractionsChartBuilder';
import type { ChartData as RankedChartData } from 'src/devtools/views/Profiler/RankedChartBuilder';
import type { Bridge } from 'src/types';

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
        const pendingKey = `${rootID}-${commitIndex}`;
        const importedProfilingData = this._store.importedProfilingData;
        if (importedProfilingData !== null) {
          const commitDetailsByCommitIndex =
            importedProfilingData.commitDetails;
          if (
            commitDetailsByCommitIndex != null &&
            commitIndex < commitDetailsByCommitIndex.length
          ) {
            const commitDetails = commitDetailsByCommitIndex[commitIndex];
            if (commitDetails != null) {
              this._pendingCommitDetailsMap.delete(pendingKey);
              resolve(commitDetails);
              return;
            }
          }
        } else if (this._store.profilingOperations.has(rootID)) {
          this._pendingCommitDetailsMap.set(pendingKey, resolve);
          this._bridge.send('getCommitDetails', {
            commitIndex,
            rendererID,
            rootID,
          });
          return;
        }

        this._pendingCommitDetailsMap.delete(pendingKey);

        // If no profiling data was recorded for this root, skip the round trip.
        resolve({
          rootID,
          commitIndex,
          actualDurations: new Map(),
          selfDurations: new Map(),
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
        const pendingKey = `${rootID}-${fiberID}`;
        const importedProfilingData = this._store.importedProfilingData;
        if (importedProfilingData !== null) {
          const { commitDetails } = importedProfilingData;
          const commitDurations = [];
          commitDetails.forEach(({ selfDurations }, commitIndex) => {
            const selfDuration = selfDurations.get(fiberID);
            if (selfDuration != null) {
              commitDurations.push(commitIndex, selfDuration);
            }
          });
          this._pendingFiberCommitsMap.delete(pendingKey);
          resolve({
            commitDurations,
            fiberID,
            rootID,
          });
          return;
        } else if (this._store.profilingOperations.has(rootID)) {
          this._pendingFiberCommitsMap.set(pendingKey, resolve);
          this._bridge.send('getFiberCommits', {
            fiberID,
            rendererID,
            rootID,
          });
          return;
        }

        this._pendingFiberCommitsMap.delete(pendingKey);

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
        const pendingKey = rootID;
        const importedProfilingData = this._store.importedProfilingData;
        if (importedProfilingData !== null) {
          const interactionsFrontend: InteractionsFrontend =
            importedProfilingData.interactions;
          if (interactionsFrontend != null) {
            this._pendingInteractionsMap.delete(pendingKey);
            resolve(interactionsFrontend);
            return;
          }
        } else if (this._store.profilingOperations.has(rootID)) {
          this._pendingInteractionsMap.set(pendingKey, resolve);
          this._bridge.send('getInteractions', {
            rendererID,
            rootID,
          });
          return;
        }

        this._pendingInteractionsMap.delete(pendingKey);

        // If no profiling data was recorded for this root, skip the round trip.
        resolve({
          interactions: [],
          rootID,
        });
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
        const pendingKey = rootID;
        const importedProfilingData = this._store.importedProfilingData;
        if (importedProfilingData !== null) {
          const profilingSummaryFrontend: ProfilingSummaryFrontend =
            importedProfilingData.profilingSummary;
          if (profilingSummaryFrontend != null) {
            this._pendingProfileSummaryMap.delete(pendingKey);
            resolve(profilingSummaryFrontend);
            return;
          }
        } else if (this._store.profilingOperations.has(rootID)) {
          this._pendingProfileSummaryMap.set(pendingKey, resolve);
          this._bridge.send('getProfilingSummary', { rendererID, rootID });
          return;
        }

        this._pendingProfileSummaryMap.delete(pendingKey);

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
  }: {|
    interactions: Array<InteractionWithCommitsFrontend>,
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
    // Invalidate Suspense caches.
    this.CommitDetails.clear();
    this.FiberCommits.clear();
    this.Interactions.clear();
    this.ProfilingSummary.clear();

    // Invalidate non-Suspense caches too.
    invalidateCommitTrees();
    invalidateFlamegraphChartData();
    invalidateInteractionsChartData();
    invalidateRankedChartData();

    this._pendingCommitDetailsMap.clear();
    this._pendingFiberCommitsMap.clear();
    this._pendingInteractionsMap.clear();
    this._pendingProfileSummaryMap.clear();
  }

  onCommitDetails = ({
    commitIndex,
    durations,
    interactions,
    rootID,
  }: CommitDetailsBackend) => {
    const key = `${rootID}-${commitIndex}`;
    const resolve = this._pendingCommitDetailsMap.get(key);
    if (resolve != null) {
      this._pendingCommitDetailsMap.delete(key);

      const actualDurationsMap = new Map<number, number>();
      const selfDurationsMap = new Map<number, number>();
      for (let i = 0; i < durations.length; i += 3) {
        const fiberID = durations[i];
        actualDurationsMap.set(fiberID, durations[i + 1]);
        selfDurationsMap.set(fiberID, durations[i + 2]);
      }

      resolve({
        actualDurations: actualDurationsMap,
        commitIndex,
        interactions,
        rootID,
        selfDurations: selfDurationsMap,
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
        const fiberID = initialTreeBaseDurations[i];
        const initialTreeBaseDuration = initialTreeBaseDurations[i + 1];
        initialTreeBaseDurationsMap.set(fiberID, initialTreeBaseDuration);
      }

      resolve({
        commitDurations,
        commitTimes,
        initialTreeBaseDurations: initialTreeBaseDurationsMap,
        interactionCount,
        rootID,
      });
    }
  };
}
