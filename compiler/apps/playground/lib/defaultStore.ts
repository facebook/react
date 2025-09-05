/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type {Store} from './stores';

const index = `\
export default function MyApp() {
  return <div>Hello World</div>;
}
`;

export const defaultConfig = `\
import type { PluginOptions } from 'babel-plugin-react-compiler/dist';

({
  compilationMode: 'infer',
  panicThreshold: 'none',
  environment: {},
  logger: null,
  gating: null,
  noEmit: false,
  dynamicGating: null,
  eslintSuppressionRules: null,
  flowSuppressions: true,
  ignoreUseNoForget: false,
  sources: filename => {
    return filename.indexOf('node_modules') === -1;
  },
  enableReanimatedCheck: true,
  customOptOutDirectives: null,
  target: '19',
} satisfies Partial<PluginOptions>);`;

export const defaultStore: Store = {
  source: index,
  config: defaultConfig,
};

export const emptyStore: Store = {
  source: '',
  config: '',
};
