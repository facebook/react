/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

throw new Error(
  'The React Compiler is currently not supported in a React Server environment. ' +
    'Ensure that modules imported with a `react-server` condition are not compiled with the React Compiler. ' +
    "Libraries should provide a dedicated `react-server` entrypoint that wasn't compiled with the React Compiler.",
);
