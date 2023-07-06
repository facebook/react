// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Original: differential_fuzz/suppressions.js
print(
/* DifferentialFuzzSuppressions: Replaced magic string */
"v***************e: some/file/name");
print(
/* DifferentialFuzzSuppressions: Replaced magic string */
"v***************e: some/file/name");

function foo(__v_0) {
  return 1 in
  /* DifferentialFuzzSuppressions: Replaced .arguments */
  __v_0;
}

print(
/* DifferentialFuzzSuppressions: Replaced ** */
192 + -0.5);
