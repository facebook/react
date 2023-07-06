// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Original: differential_fuzz/mutations.js
var __v_0 = [1, 2, 3];

/* DifferentialFuzzMutator: Extra variable printing */
__prettyPrintExtra(__v_0);

for (let __v_1 = 0; __v_1 < 3; __v_1 += 1) {
  let __v_2,
      __v_3 = 0;

  /* DifferentialFuzzMutator: Extra variable printing */
  __prettyPrintExtra(__v_2);

  __prettyPrintExtra(__v_3);

  __v_0.foo = undefined;

  /* DifferentialFuzzMutator: Extra variable printing */
  __prettyPrintExtra(__v_0);

  /* DifferentialFuzzMutator: Pretty printing */
  __prettyPrintExtra(0);

  try {
    __v_1 += 1;

    /* DifferentialFuzzMutator: Extra variable printing */
    __prettyPrintExtra(__v_1);
  } catch (e) {
    __prettyPrintExtra(e);
  }
}

/* DifferentialFuzzMutator: Print variables and exceptions from section */
try {
  print("Hash: " + __hash);
  print("Caught: " + __caught);

  __prettyPrint(__v_0);
} catch (e) {}
