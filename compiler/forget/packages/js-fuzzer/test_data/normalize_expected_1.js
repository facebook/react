// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

// Original: normalize.js
class __c_1 {
  constructor() {
    this.abc = 789;
    this.selfRef = __c_1;
  }

}

function __f_1() {
  let __v_5 = 123;
  console.log(__v_5);
}

__f_1();

let __v_3 = 456;
console.log(__v_3);

let __v_4 = new __c_1();

console.log(__v_4.abc);
