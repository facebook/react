/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Wakeable} from 'shared/ReactTypes';
import type {GitHubIssue} from './githubAPI';

import {unstable_getCacheForType as getCacheForType} from 'react';
import {searchGitHubIssues} from './githubAPI';

const API_TIMEOUT = 3000;

const Pending = 0;
const Resolved = 1;
const Rejected = 2;

type PendingRecord = {|
  status: 0,
  value: Wakeable,
|};

type ResolvedRecord<T> = {|
  status: 1,
  value: T,
|};

type RejectedRecord = {|
  status: 2,
  value: null,
|};

type Record<T> = PendingRecord | ResolvedRecord<T> | RejectedRecord;

function readRecord<T>(record: Record<T>): ResolvedRecord<T> | RejectedRecord {
  if (record.status === Resolved) {
    // This is just a type refinement.
    return record;
  } else if (record.status === Rejected) {
    // This is just a type refinement.
    return record;
  } else {
    throw record.value;
  }
}

type GitHubIssueMap = Map<string, Record<GitHubIssue>>;

function createMap(): GitHubIssueMap {
  return new Map();
}

function getRecordMap(): Map<string, Record<GitHubIssue>> {
  return getCacheForType(createMap);
}

export function findGitHubIssue(errorMessage: string): GitHubIssue | null {
  errorMessage = normalizeErrorMessage(errorMessage);

  const map = getRecordMap();
  let record = map.get(errorMessage);

  if (!record) {
    const callbacks = new Set();
    const wakeable: Wakeable = {
      then(callback) {
        callbacks.add(callback);
      },

      // Optional property used by Timeline:
      displayName: `Searching GitHub issues for error "${errorMessage}"`,
    };
    const wake = () => {
      // This assumes they won't throw.
      callbacks.forEach(callback => callback());
      callbacks.clear();
    };
    const newRecord: Record<GitHubIssue> = (record = {
      status: Pending,
      value: wakeable,
    });

    let didTimeout = false;

    searchGitHubIssues(errorMessage)
      .then(maybeItem => {
        if (didTimeout) {
          return;
        }

        if (maybeItem) {
          const resolvedRecord = ((newRecord: any): ResolvedRecord<GitHubIssue>);
          resolvedRecord.status = Resolved;
          resolvedRecord.value = maybeItem;
        } else {
          const notFoundRecord = ((newRecord: any): RejectedRecord);
          notFoundRecord.status = Rejected;
          notFoundRecord.value = null;
        }

        wake();
      })
      .catch(error => {
        const thrownRecord = ((newRecord: any): RejectedRecord);
        thrownRecord.status = Rejected;
        thrownRecord.value = null;

        wake();
      });

    // Only wait a little while for GitHub results before showing a fallback.
    setTimeout(() => {
      didTimeout = true;

      const timedoutRecord = ((newRecord: any): RejectedRecord);
      timedoutRecord.status = Rejected;
      timedoutRecord.value = null;

      wake();
    }, API_TIMEOUT);

    map.set(errorMessage, record);
  }

  const response = readRecord(record).value;
  return response;
}

function normalizeErrorMessage(errorMessage: string): string {
  // Remove Fiber IDs from error message (as those will be unique).
  errorMessage = errorMessage.replace(/"[0-9]+"/, '');
  return errorMessage;
}
