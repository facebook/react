/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const React = require("react");

/*
 * Our e2e babel transform currently only compiles functions, not programs.
 * As a result, our e2e transpiled code does not contain an import for `useMemoCache`
 * This is a hack.
 */
React.useMemoCache = React.unstable_useMemoCache;
globalThis.useMemoCache = React.unstable_useMemoCache;
