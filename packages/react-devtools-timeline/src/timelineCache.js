/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Wakeable} from 'shared/ReactTypes';
import type {TimelineData} from './types';

import {importFile as importFileWorker} from './import-worker';

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
  value: Error,
|};

type Record<T> = PendingRecord | ResolvedRecord<T> | RejectedRecord;

// This is intentionally a module-level Map, rather than a React-managed one.
// Otherwise, refreshing the inspected element cache would also clear this cache.
// Profiler file contents are static anyway.
const fileNameToProfilerDataMap: Map<string, Record<TimelineData>> = new Map();

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

export function importFile(file: File): TimelineData | Error {
  const fileName = file.name;
  let record = fileNameToProfilerDataMap.get(fileName);

  if (!record) {
    const callbacks = new Set();
    const wakeable: Wakeable = {
      then(callback) {
        callbacks.add(callback);
      },

      // Optional property used by Timeline:
      displayName: `Importing file "${fileName}"`,
    };

    const wake = () => {
      // This assumes they won't throw.
      callbacks.forEach(callback => callback());
      callbacks.clear();
    };

    const newRecord: Record<TimelineData> = (record = {
      status: Pending,
      value: wakeable,
    });

    importFileWorker(file).then(data => {
      switch (data.status) {
        case 'SUCCESS':
          const resolvedRecord = ((newRecord: any): ResolvedRecord<TimelineData>);
          resolvedRecord.status = Resolved;
          resolvedRecord.value = data.processedData;
          break;
        case 'INVALID_PROFILE_ERROR':
        case 'UNEXPECTED_ERROR':
          const thrownRecord = ((newRecord: any): RejectedRecord);
          thrownRecord.status = Rejected;
          thrownRecord.value = data.error;
          break;
      }

      wake();
    });

    fileNameToProfilerDataMap.set(fileName, record);
  }

  const response = readRecord(record).value;
  return response;
}
