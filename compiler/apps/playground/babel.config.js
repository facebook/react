/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["next/babel"],
    overrides: [
      {
        test: /^((?!node_modules).)*$/g,
        plugins: [
          [
            "babel-plugin-react-forget",
            {
              compilationMode: "infer",
              panicThreshold: "NONE",
              enableUseMemoCachePolyfill: true,
            },
          ],
        ],
      },
    ],
  };
};
