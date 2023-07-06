// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


// Print after declaration.
var __v_0 = [1, 2, 3];

// Don't print after declarations or assigments in loops.
for (let __v_1 = 0; __v_1 < 3; __v_1 += 1) {

  // Print after multiple declarations.
  let __v_2, __v_3 = 0;

  // Print after assigning to member.
  __v_0.foo = undefined;

  // Replace with deep printing.
  print(0);

  // Print exception.
  try {
    // Print after assignment.
    __v_1 += 1;
  } catch(e) {}
}
