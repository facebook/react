/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// We have to require this specific file because much of the ESLint codebase
// uses modules like `fs` or `path` that won't work in a browser. This also
// helps to keep the codebase size small.
// This approach is inspired by ESLint's playground:
// https://github.com/eslint/playground/blob/f3b1f78cc1c06dadfe7bb50c6c0f913c0d23670d/src/playground/components/CodeEditor.js#L8
export { Linter } from "../node_modules/eslint/lib/linter";
