// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

function debug(msg) {
  __prettyPrintExtra(msg);
}

function shouldBe(_a) {
  __prettyPrintExtra((typeof _a == "function" ? _a() : eval(_a)));
}
