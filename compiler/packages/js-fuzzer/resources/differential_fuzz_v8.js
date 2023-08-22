// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.


// Adjust mjsunit behavior for differential fuzzing.

// We're not interested in stack traces.
MjsUnitAssertionError = () => {};

// Do more printing in assertions for more correctness coverage.
failWithMessage = message => { __prettyPrint(message); };
assertSame = (expected, found, name_opt) => { __prettyPrint(found); };
assertNotSame = (expected, found, name_opt) => { __prettyPrint(found); };
assertEquals = (expected, found, name_opt) => { __prettyPrint(found); };
assertNotEquals = (expected, found, name_opt) => { __prettyPrint(found); };
assertNull = (value, name_opt) => { __prettyPrint(value); };
assertNotNull = (value, name_opt) => { __prettyPrint(value); };

// Suppress optimization status as it leads to false positives.
assertUnoptimized = () => {};
assertOptimized = () => {};
isNeverOptimize = () => {};
isAlwaysOptimize = () => {};
isInterpreted = () => {};
isBaseline = () => {};
isUnoptimized = () => {};
isOptimized = () => {};
isTurboFanned = () => {};
