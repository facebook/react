// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/* FunctionCallMutator: Compiling baseline __f_0 */
%CompileBaseline(__f_0);

// Original: mutate_function_call.js
__f_0(1);

a = (
/* FunctionCallMutator: Compiling baseline __f_0 */
%CompileBaseline(__f_0), __f_0(1));
foo(1, (
/* FunctionCallMutator: Compiling baseline __f_0 */
%CompileBaseline(__f_0), __f_0()));
