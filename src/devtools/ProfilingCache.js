// @flow

import { createResource, invalidateResources } from './cache';
import Store from './store';
import {
  getCommitTree,
  invalidateCommitTrees,
} from 'src/devtools/views/Profiler/CommitTreeBuilder';

import type { Resource } from './cache';
import type { Bridge } from '../types';
import type {
  CommitDetails as CommitDetailsBackend,
  ProfilingSummary as ProfilingSummaryBackend,
} from 'src/backend/types';
import type {
  CommitDetails as CommitDetailsFrontend,
  CommitTree,
  ProfilingSummary as ProfilingSummaryFrontend,
} from 'src/devtools/views/Profiler/types';

type CommitDetailsParams = {|
  commitIndex: number,
  rootID: number,
  rendererID: number,
|};

type CommitTreeParams = {|
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
  _pendingCommitDetailsMap: Map<
    string,
    (commitDetails: CommitDetailsFrontend) => void
  > = new Map();

  _pendingProfileSummaryMap: Map<
    number,
    (profilingSummary: ProfilingSummaryFrontend) => void
  > = new Map();

  CommitDetails: Resource<CommitDetailsParams, CommitDetailsFrontend>;
  CommitTree: Resource<CommitTreeParams, CommitTree>;
  ProfilingSummary: Resource<ProfilingSummaryParams, ProfilingSummaryFrontend>;

  constructor(bridge: Bridge, store: Store) {
    this.CommitDetails = createResource(
      ({ commitIndex, rendererID, rootID }: CommitDetailsParams) => {
        return new Promise(resolve => {
          if (!store.profilingOperations.has(rootID)) {
            // If no profiling data was recorded for this root, skip the round trip.
            resolve({
              committedFibers: [],
              interactions: [],
            });
          } else {
            this._pendingCommitDetailsMap.set(
              `${rootID}-${commitIndex}`,
              resolve
            );
            bridge.send('getCommitDetails', {
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

    this.CommitTree = createResource(
      ({
        commitIndex,
        profilingSummary,
        rendererID,
        rootID,
      }: CommitTreeParams) =>
        new Promise(resolve =>
          resolve(
            getCommitTree({
              commitIndex,
              profilingSummary,
              rendererID,
              rootID,
              store,
            })
          )
        ),
      ({
        commitIndex,
        profilingSummary,
        rendererID,
        rootID,
      }: CommitTreeParams) => `${rootID}-${commitIndex}`
    );

    this.ProfilingSummary = createResource(
      ({ rendererID, rootID }: ProfilingSummaryParams) => {
        return new Promise(resolve => {
          if (!store.profilingOperations.has(rootID)) {
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
      ({ rendererID, rootID }: ProfilingSummaryParams) => rootID
    );

    bridge.addListener('commitDetails', this.onCommitDetails);
    bridge.addListener('profilingSummary', this.onProfileSummary);
  }

  invalidate() {
    invalidateResources();
    invalidateCommitTrees();

    this._pendingCommitDetailsMap.clear();
    this._pendingProfileSummaryMap.clear();
  }

  onCommitDetails = ({
    commitIndex,
    committedFibers,
    interactions,
    rootID,
  }: CommitDetailsBackend) => {
    const key = `${rootID}-${commitIndex}`;
    const resolve = this._pendingCommitDetailsMap.get(key);
    if (resolve != null) {
      this._pendingCommitDetailsMap.delete(key);

      resolve({
        committedFibers,
        interactions,
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
