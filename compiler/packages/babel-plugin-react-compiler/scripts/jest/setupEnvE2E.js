/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const ReactCompilerRuntime = require('react/compiler-runtime');

/*
 * Our e2e babel transform currently only compiles functions, not programs.
 * As a result, our e2e transpiled code does not contain an import for the
 * memo cache function. As a temporary hack, we add a `_c` global, which is
 * the name that is used for the import by default.
 */
globalThis._c = ReactCompilerRuntime.c;
