// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


// Don't breach stack limit in differential fuzzing as it leads to
// early bailout.
runNearStackLimit = function(f) {
  try {
    f();
  } catch (e) {}
};
