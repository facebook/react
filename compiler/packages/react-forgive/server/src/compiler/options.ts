/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {
  parsePluginOptions,
  type PluginOptions,
} from 'babel-plugin-react-compiler/src';
import {cosmiconfigSync} from 'cosmiconfig';

export function resolveReactConfig(projectPath: string): PluginOptions | null {
  const explorerSync = cosmiconfigSync('react', {
    searchStrategy: 'project',
    cache: true,
  });
  const result = explorerSync.search(projectPath);
  if (result != null) {
    return parsePluginOptions(result.config);
  } else {
    return null;
  }
}
