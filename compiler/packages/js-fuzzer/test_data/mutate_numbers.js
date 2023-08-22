// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

function foo() {
  let a = 123;
  for (let i = 0; i < 456; i++) {
    a += 1;
  }

  let b = 0;
  while (b < 10) {
    b += 2;
  }

  a += 1;
}

var a = {0: "", 1: "", get 1(){}};
var b = -10;
