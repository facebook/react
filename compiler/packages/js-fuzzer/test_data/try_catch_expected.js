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
      try {
        var b = 0;
      } catch (e) {}

      try {
        while (b < 10) {
          try {
            console.log(b);
          } catch (e) {}

          try {
            b += 2;
          } catch (e) {}

          continue label;
        }
      } catch (e) {}
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
    try {
      1;
    } catch (e) {}

    try {
      1;
    } catch (e) {}
  })();
} catch (e) {}

try {
  if (true) {
    try {
      2;
    } catch (e) {}

    try {
      2;
    } catch (e) {}
  } else {
    try {
      3;
    } catch (e) {}

    try {
      3;
    } catch (e) {}
  }
} catch (e) {}

let a = 0;

try {
  switch (a) {
    case 1:
      try {
        1;
      } catch (e) {}

  }
} catch (e) {}

try {
  with (Math) {
    try {
      cos(PI);
    } catch (e) {}
  }
} catch (e) {}

let module = function () {
  try {
    return new WebAssembly.Module(builder.toBuffer());
  } catch (e) {}
}();
