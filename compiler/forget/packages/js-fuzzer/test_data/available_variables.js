// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

let __v_0 = 0;
let __v_1 = 0;

console.log(__v_0, __v_1, __f_0, __f_1);

function __f_0() {
  let __v_2 = 0;
  console.log(__v_0, __v_1, __v_2, __f_0, __f_1);
}

let __v_3 = 0;

console.log(__v_0, __v_1, __v_3, __f_0, __f_1);

function __f_1(__v_7) {
  let __v_4 = 0;

  console.log(__v_0, __v_1, __v_3, __v_4, __v_7, __f_0, __f_1);
  {
    let __v_5 = 0;
    var __v_6 = 0;
    console.log(__v_0, __v_1, __v_3, __v_4, __v_5, __v_6, __v_7, __f_0, __f_1, __f_2);
    function __f_2 () {};
    console.log(__v_0, __v_1, __v_3, __v_4, __v_5, __v_6, __v_7, __f_0, __f_1, __f_2);
  }
  // TODO(machenbach): __f_2 is missing as available identifier.
  console.log(__v_0, __v_1, __v_3, __v_4, __v_6, __v_7, __f_0, __f_1, __f_2);
}
console.log(__v_0, __v_1, __v_3, __f_0, __f_1);
