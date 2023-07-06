// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Minimally stub out methods from JSTest's standalone-pre.js.
function description(msg) {}
function debug(msg) {}

function shouldBe(_a) {
  print((typeof _a == "function" ? _a() : eval(_a)));
}

function shouldBeTrue(_a) { shouldBe(_a); }
function shouldBeFalse(_a) { shouldBe(_a); }
function shouldBeNaN(_a) { shouldBe(_a); }
function shouldBeNull(_a) { shouldBe(_a); }
function shouldNotThrow(_a) { shouldBe(_a); }
function shouldThrow(_a) { shouldBe(_a); }

function noInline() {}
function finishJSTest() {}

// Stub out $vm.
try {
  $vm;
} catch(e) {
  const handler = {
    get: function(x, prop) {
      if (prop == Symbol.toPrimitive) {
        return function() { return undefined; };
      }
      return dummy;
    },
  };
  const dummy = new Proxy(function() { return dummy; }, handler);
  this.$vm = dummy;
}

// Other functions.
function ensureArrayStorage() {}
function transferArrayBuffer() {}
