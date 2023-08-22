/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { forwardRef } from "react";

// Capped to 3 digits
const CountBadge = forwardRef(
  ({ count = 0, type = "danger", rounded = false }, ref) => {
    return (
      <span
        ref={ref}
        className={`badge ${rounded && "rounded-pill"} badge-${type}`}
      >
        {count > 999 ? 999 : count}
      </span>
    );
  }
);

export default CountBadge;
