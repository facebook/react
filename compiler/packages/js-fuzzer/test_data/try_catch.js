// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function blah() {
  try {
    var a = 10;
    console.log(a);
  } catch (e) {}

  label: for (var i = 0; i < 100; i++) {
    var b = 0;
    while (b < 10) {
      console.log(b);
      b += 2;
      continue label;
    }
  }
}

blah();
blah();

(function () {1;1;})();

if (true) {
  2;2;
} else {
  3;3;
}

let a = 0;
switch (a) {
  case 1: 1;
}

with (Math) {
  cos(PI);
}

let module = new WebAssembly.Module(builder.toBuffer());
