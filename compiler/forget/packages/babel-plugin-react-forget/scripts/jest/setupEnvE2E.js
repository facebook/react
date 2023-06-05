/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require("react");
const ForgetRuntime = require("../../packages/react-forget-runtime");
React.unstable_ForgetRuntime = ForgetRuntime;
React.unstable_useMemoCache = ForgetRuntime.unstable_useMemoCache;
