// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


// Adjust chakra behavior for differential fuzzing.

this.WScript = new Proxy({}, {
  get(target, name) {
    switch (name) {
      case 'Echo':
        return __prettyPrintExtra;
      default:
        return {};
    }
  }
});
