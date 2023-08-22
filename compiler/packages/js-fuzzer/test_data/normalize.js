// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

class Class {
  constructor() {
    this.abc = 789;
    this.selfRef = Class;
  }
}

function foo() {
  let a = 123;
  console.log(a);
}

foo();
let a = 456;
console.log(a);
let b = new Class();
console.log(b.abc);
