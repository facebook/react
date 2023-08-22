// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

%PrepareFunctionForOptimization(__f_0);

__f_0(1);

__f_0(1);

%OptimizeMaglevOnNextCall(__f_0);

// Original: mutate_function_call.js

/* FunctionCallMutator: Optimizing __f_0 */
__f_0(1);

a = (
/* FunctionCallMutator: Optimizing __f_0 */
%PrepareFunctionForOptimization(__f_0), __f_0(1), __f_0(1), %OptimizeMaglevOnNextCall(__f_0), __f_0(1));
foo(1, (
/* FunctionCallMutator: Optimizing __f_0 */
%PrepareFunctionForOptimization(__f_0), __f_0(), __f_0(), %OptimizeMaglevOnNextCall(__f_0), __f_0()));
