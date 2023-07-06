// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Helper neuter function.
function nop() { return false; }

// Stubs for non-standard functions.
try { gc; } catch(e) {
  this.gc = function () {
    for (let i = 0; i < 10000; i++) {
      let s = new String("AAAA" + Math.random());
    }
  }
}
try { uneval; } catch(e) { this.uneval = this.nop; }

try {
  // For Chakra tests.
  WScript;
} catch(e) {
  this.WScript = new Proxy({}, {
    get(target, name) {
      switch (name) {
        case 'Echo':
          return print;
        default:
          return {};
      }

    }
  });
}

try { this.alert = console.log; } catch(e) { }
try { this.print = console.log; } catch(e) { }
