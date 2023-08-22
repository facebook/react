// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

// Original: normalize.js
class __c_0 {
  constructor() {
    this.abc = 789;
    this.selfRef = __c_0;
  }

}

function __f_0() {
  let __v_2 = 123;
  console.log(__v_2);
}

__f_0();

let __v_0 = 456;
console.log(__v_0);

let __v_1 = new __c_0();

console.log(__v_1.abc);
