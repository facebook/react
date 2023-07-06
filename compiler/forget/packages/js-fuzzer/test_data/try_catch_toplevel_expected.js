// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Original: try_catch.js
function blah() {
  try {
    try {
      var a = 10;
    } catch (e) {}

    try {
      console.log(a);
    } catch (e) {}
  } catch (e) {}

  try {
    label: for (var i = 0; i < 100; i++) {
      var b = 0;

      while (b < 10) {
        console.log(b);
        b += 2;
        continue label;
      }
    }
  } catch (e) {}
}

try {
  blah();
} catch (e) {}

try {
  blah();
} catch (e) {}

try {
  (function () {
    1;
    1;
  })();
} catch (e) {}

try {
  if (true) {
    2;
    2;
  } else {
    3;
    3;
  }
} catch (e) {}

let a = 0;

try {
  switch (a) {
    case 1:
      1;
  }
} catch (e) {}

try {
  with (Math) {
    cos(PI);
  }
} catch (e) {}

let module = function () {
  try {
    return new WebAssembly.Module(builder.toBuffer());
  } catch (e) {}
}();
