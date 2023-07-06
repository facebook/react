// Copyright 2022 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var i = 1;
var j = 'str';
var k = undefined;
var l = {0: 1};

function foo(a, b) {
  return a + b;
}

foo(i, 3);

function bar(a) {
  return foo(a, a);
}

foo('foo', j);
bar(2, foo(i, j));
foo(i, j);
bar(j, 3);
