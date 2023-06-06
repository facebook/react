/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Surfaces diagnostics from React Forget",
      recommended: true,
    },
  },
  create(_context: Rule.RuleContext) {
    return {};
  },
};

export default rule;
