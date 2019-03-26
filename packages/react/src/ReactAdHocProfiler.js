/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import invariant from 'shared/invariant';

export type ID = 'createElement' | 'commitRoot' | 'dom' | 'performUnitOfWork';

export type TimingInfo = {|
  count: number,
  total: number,
|};

const times: Map<ID, TimingInfo> = new Map();
times.set('createElement', {count: 0, total: 0});
times.set('commitRoot', {count: 0, total: 0});
times.set('dom', {count: 0, total: 0});
times.set('performUnitOfWork', {count: 0, total: 0});

const now =
  typeof performance === 'object' && typeof performance.now === 'function'
    ? () => performance.now()
    : () => Date.now();

function printAdHocProfilingInfo() {
  console.table(
    Array.from(times.entries()).map(([id, {count, total}]) => ({
      id,
      count,
      total,
    })),
  );
}

const ids: Array<ID> = [];
const startTimes: Array<number> = [];

function startAdHocProfiler(id: ID) {
  ids.push(id);
  startTimes.push(now());
}

function stopAdHocProfiler(expectedID: ID) {
  const id = ids.pop();

  invariant(id === expectedID, 'Expect id "%s" but got "%s"', expectedID, id);

  const startTime = startTimes.pop();
  const elapsed = now() - startTime;

  const {count, total} = ((times.get(id): any): TimingInfo);
  times.set(id, {count: count + 1, total: total + elapsed});

  for (let i = 0; i < startTimes.length; i++) {
    startTimes[i] += elapsed;
  }
}

const ReactAdHocProfiler = {
  printAdHocProfilingInfo,
  startAdHocProfiler,
  stopAdHocProfiler,
};

export default ReactAdHocProfiler;
