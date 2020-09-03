/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import 'regenerator-runtime/runtime';

import type {TimelineEvent} from '@elg/speedscope';
import type {ReactProfilerData} from '../types';

import preprocessData from './preprocessData';
import {readInputData} from './readInputData';

declare var self: DedicatedWorkerGlobalScope;

type ImportWorkerInputData = {|
  file: File,
|};

export type ImportWorkerOutputData =
  | {|status: 'SUCCESS', processedData: ReactProfilerData|}
  | {|status: 'ERROR', error: Error|};

self.onmessage = async function(event: MessageEvent) {
  const {file} = ((event.data: any): ImportWorkerInputData);

  try {
    const readFile = await readInputData(file);
    const events: TimelineEvent[] = JSON.parse(readFile);
    if (events.length === 0) {
      throw new Error('No profiling data found in file.');
    }

    self.postMessage({
      status: 'SUCCESS',
      processedData: preprocessData(events),
    });
  } catch (error) {
    self.postMessage({
      status: 'ERROR',
      error,
    });
  }
};
