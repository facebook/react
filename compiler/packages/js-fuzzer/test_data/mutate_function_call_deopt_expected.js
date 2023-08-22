// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var _temp, _temp2;

// Original: mutate_function_call.js

/* FunctionCallMutator: Deoptimizing __f_0 */
__f_0(1);

%DeoptimizeFunction(__f_0);

a = (
/* FunctionCallMutator: Deoptimizing __f_0 */
_temp = __f_0(1), %DeoptimizeFunction(__f_0), _temp);
foo(1, (
/* FunctionCallMutator: Deoptimizing __f_0 */
_temp2 = __f_0(), %DeoptimizeFunction(__f_0), _temp2));
