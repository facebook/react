// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

// Original: mutate_numbers.js
function foo() {
  let a =
  /* NumberMutator: Replaced 123 with -5 */
  -5;

  for (let i = 0; i < 456; i++) {
    a +=
    /* NumberMutator: Replaced 1 with -4 */
    -4;
  }

  let b =
  /* NumberMutator: Replaced 0 with -3 */
  -3;

  while (b < 10) {
    b += 2;
  }

  a +=
  /* NumberMutator: Replaced 1 with -5 */
  -5;
}

var a = {
  /* NumberMutator: Replaced 0 with 4 */
  4: "",

  /* NumberMutator: Replaced 1 with 3 */
  3: "",

  get
  /* NumberMutator: Replaced 1 with 5 */
  5() {}

};
var b =
/* NumberMutator: Replaced -10 with -4 */
-4;
