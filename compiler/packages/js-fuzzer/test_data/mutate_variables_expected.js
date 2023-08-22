// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Original: mutate_variables.js
function __f_0(__v_10, __v_11) {
  let __v_4 = 4;
  let __v_5 = 5;
  let __v_6 = 6;
  let __v_7 = 7;
  console.log(
  /* VariableMutator: Replaced __v_4 with REPLACED */
  REPLACED);
  console.log(
  /* VariableMutator: Replaced __v_5 with REPLACED */
  REPLACED);
  console.log(
  /* VariableMutator: Replaced __v_6 with REPLACED */
  REPLACED);
  console.log(
  /* VariableMutator: Replaced __v_7 with REPLACED */
  REPLACED);

  for (let __v_9 = 0; __v_9 < 10; __v_9++) {
    console.log(
    /* VariableMutator: Replaced __v_4 with REPLACED */
    REPLACED);
  }

  let __v_8 = 0;

  while (__v_8 < 10) {
    __v_8++;
  }
}

let __v_0 = 1;
let __v_1 = 2;
let __v_2 = 3;
let __v_3 = 4;
console.log(
/* VariableMutator: Replaced __v_0 with REPLACED */
REPLACED);
console.log(
/* VariableMutator: Replaced __v_1 with REPLACED */
REPLACED);
console.log(
/* VariableMutator: Replaced __v_2 with REPLACED */
REPLACED);
console.log(
/* VariableMutator: Replaced __v_3 with REPLACED */
REPLACED);

__f_0();
