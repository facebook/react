// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Original: mutate_var_or_obj.js
let __v_0 = {};

/* VariableOrObjectMutator: Random mutation */
delete __getRandomObject(123)[__getRandomProperty(__getRandomObject(123), 123)], __callGC();
__getRandomObject(123)[__getRandomProperty(__getRandomObject(123), 123)], __callGC();
Math.pow(1, 2);

/* VariableOrObjectMutator: Random mutation */
__getRandomObject(123)[__getRandomProperty(__getRandomObject(123), 123)] = 0, __callGC();
Math.pow(1, 2);

/* VariableOrObjectMutator: Random mutation */
__v_0 = __getRandomObject(123), __callGC();
Math.pow(1, 2);

/* VariableOrObjectMutator: Random mutation */
if (__getRandomObject(123) != null && typeof __getRandomObject(123) == "object") Object.defineProperty(__getRandomObject(123), __getRandomProperty(__getRandomObject(123), 123), {
  value: 0
});
Math.pow(1, 2);

/* VariableOrObjectMutator: Random mutation */
if (__getRandomObject(123) != null && typeof __getRandomObject(123) == "object") Object.defineProperty(__getRandomObject(123), __getRandomProperty(__getRandomObject(123), 123), {
  get: function () {
    delete __getRandomObject(123)[__getRandomProperty(__getRandomObject(123), 123)], __callGC();
    return 0;
  },
  set: function (value) {
    __getRandomObject(123)[__getRandomProperty(__getRandomObject(123), 123)], __callGC();
  }
});
Math.pow(1, 2);
