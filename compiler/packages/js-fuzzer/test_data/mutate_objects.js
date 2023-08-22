// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Empty objects are not manipulated.
a = {};
a = {};
a = {};
a = {};
a = {};
a = {};

// Small objects only get some mutations.
a = {1: 0};
a = {a: 0};
a = {"s": 0};
a = {1: 0};
a = {a: 0};
a = {"s": 0};

// Larger objects get all mutations.
a = {1: "a", 2: "b", 3: "c"};
a = {1: "a", 2: "b", 3: "c"};
a = {1: "a", 2: "b", 3: "c"};
a = {1: "a", 2: "b", 3: "c"};
a = {1: "a", 2: "b", 3: "c"};
a = {1: "a", 2: "b", 3: "c"};
a = {1: "a", 2: "b", 3: "c"};
a = {1: "a", 2: "b", 3: "c"};
a = {1: "a", 2: "b", 3: "c"};
a = {1: "a", 2: "b", 3: "c"};

// Getters and setters are ignored.
a = {get bar() { return 0 }, 1: 0, set bar(t) {}};
a = {get bar() { return 0 }, 1: 0, set bar(t) {}};
a = {get bar() { return 0 }, 1: 0, set bar(t) {}};

// Recursive.
a = {1: {4: "4", 5: "5", 6: "6"}, 2: {3: "3"}};
a = {1: {4: "4", 5: "5", 6: "6"}, 2: {3: "3"}};
a = {1: {4: "4", 5: "5", 6: "6"}, 2: {3: "3"}};
