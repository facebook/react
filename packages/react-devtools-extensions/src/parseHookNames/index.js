/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {HookSourceAndMetadata} from './loadSourceAndMetadata';
import type {HooksNode, HooksTree} from 'react-debug-tools/src/ReactDebugHooks';
import type {HookNames} from 'react-devtools-shared/src/types';

import {withAsyncPerformanceMark} from 'react-devtools-shared/src/PerformanceMarks';
import WorkerizedParseSourceAndMetadata from './parseSourceAndMetadata.worker';
import typeof * as ParseSourceAndMetadataModule from './parseSourceAndMetadata';
import loadSourceAndMetadata from './loadSourceAndMetadata';

const workerizedParseHookNames: ParseSourceAndMetadataModule = WorkerizedParseSourceAndMetadata();

export function parseSourceAndMetadata(
  hooksList: Array<HooksNode>,
  locationKeyToHookSourceAndMetadata: Map<string, HookSourceAndMetadata>,
): Promise<HookNames | null> {
  return workerizedParseHookNames.parseSourceAndMetadata(
    hooksList,
    locationKeyToHookSourceAndMetadata,
  );
}

export const purgeCachedMetadata = workerizedParseHookNames.purgeCachedMetadata;

export async function parseHookNames(
  hooksTree: HooksTree,
): Promise<HookNames | null> {
  return withAsyncPerformanceMark('parseHookNames', async () => {
    // Runs on the main/UI thread so it can reuse Network cache:
    const [
      hooksList,
      locationKeyToHookSourceAndMetadata,
    ] = await loadSourceAndMetadata(hooksTree);

    // Runs in a Worker because it's CPU intensive:
    return parseSourceAndMetadata(
      hooksList,
      locationKeyToHookSourceAndMetadata,
    );
  });
}
