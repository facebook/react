/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { useMemoCache } from "./useMemoCache";
const initialTasks = [{
  id: 0,
  text: "memo",
  done: true
}, {
  id: 1,
  text: "useCallback",
  done: false
}, {
  id: 2,
  text: "useMemo",
  done: false
}];
export default initialTasks;
