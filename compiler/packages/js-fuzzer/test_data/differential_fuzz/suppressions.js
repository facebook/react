// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// These statements might come from a CrashTest.
print("v8-foozzie source: some/file/name");
print('v8-foozzie source: some/file/name');

function foo(__v_0) {
  // This is an unsupported language feature.
  return 1 in foo.arguments;
}

// This leads to precision differences in optimized code.
print(192 ** -0.5);
