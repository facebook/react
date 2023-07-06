// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Original: spidermonkey/shell.js
console.log('/shell.js');
if (!ok) throw new Error(`*****tion failed: ${f} did not throw as expected`);

// Original: spidermonkey/test/shell.js
console.log('/test/shell.js');

// Original: spidermonkey/load1.js
console.log('load1.js');

// Original: spidermonkey/test/load2.js
console.log('load2.js');

// Original: spidermonkey/test/load.js
console.log('load.js');
if (!ok) throw new Error(`*****tion failed: Some text`);
print("*****tion failed: Some text");
check()`\01`;
