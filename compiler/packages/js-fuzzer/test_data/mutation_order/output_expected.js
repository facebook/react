// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Script mutator: using shuffled mutators
// Script mutator: extra ArrayMutator
// Script mutator: extra VariableMutator
// Script mutator: extra ExpressionMutator
// Script mutator: extra ArrayMutator

// Original: mutation_order/input.js
try {
  var __v_0 =
  /* NumberMutator: Replaced 1 with -10 */
  -10;
} catch (e) {}

try {
  var __v_1 = 'str';
} catch (e) {}

try {
  var __v_2 = undefined;
} catch (e) {}

try {
  var __v_3 = {
    /* NumberMutator: Replaced 0 with 8 */
    8:
    /* NumberMutator: Replaced 1 with 3 */
    3
  };
} catch (e) {}

function __f_0(__v_4, __v_5) {
  return __v_4 + __v_5;
}

try {
  %PrepareFunctionForOptimization(__f_0);
} catch (e) {}

try {
  __f_0(__v_0,
  /* NumberMutator: Replaced 3 with 5 */
  5);
} catch (e) {}

try {
  __f_0(__v_0,
  /* NumberMutator: Replaced 3 with NaN */
  NaN);
} catch (e) {}

try {
  %OptimizeFunctionOnNextCall(__f_0);
} catch (e) {}

try {
  /* FunctionCallMutator: Optimizing __f_0 */
  __f_0(__v_0,
  /* NumberMutator: Replaced 3 with 2 */
  2);
} catch (e) {}

function __f_1(__v_6) {
  return (
    /* FunctionCallMutator: Replaced __f_0 with __f_0 */
    __f_0(__v_6, __v_6)
  );
}

try {
  %PrepareFunctionForOptimization(__f_0);
} catch (e) {}

try {
  __f_0('foo', __v_1);
} catch (e) {}

try {
  __f_0('foo', __v_1);
} catch (e) {}

try {
  %OptimizeFunctionOnNextCall(__f_0);
} catch (e) {}

try {
  /* FunctionCallMutator: Optimizing __f_0 */
  __f_0('foo', __v_1);
} catch (e) {}

try {
  /* FunctionCallMutator: Compiling baseline __f_1 */
  %CompileBaseline(__f_1);
} catch (e) {}

try {
  __f_1(
  /* NumberMutator: Replaced 2 with -10 */
  -10, __f_0(__v_0, __v_1));
} catch (e) {}

try {
  /* FunctionCallMutator: Deoptimizing __f_0 */
  __f_0(__v_0, __v_1);
} catch (e) {}

try {
  %DeoptimizeFunction(__f_0);
} catch (e) {}

try {
  /* FunctionCallMutator: Replaced __f_1 with __f_1 */
  __f_1(__v_1,
  /* NumberMutator: Replaced 3 with 16 */
  16);
} catch (e) {}
