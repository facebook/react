// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Original: mutate_objects.js
a = {};
a = {};
a = {};
a = {};
a = {};
a = {};
a =
/* ObjectMutator: Insert a random value */
{
  1: ""
};
a = {
  a: 0
};
a =
/* ObjectMutator: Insert a random value */
{
  "s": ""
};
a =
/* ObjectMutator: Stringify a property key */
{
  "1": 0
};
a =
/* ObjectMutator: Remove a property */
{};
a = {
  "s": 0
};
a =
/* ObjectMutator: Swap properties */
{
  1: "c",
  2: "b",
  3: "a"
};
a =
/* ObjectMutator: Remove a property */
{
  2: "b",
  3: "c"
};
a =
/* ObjectMutator: Insert a random value */
{
  1: "a",
  2: "",
  3: "c"
};
a =
/* ObjectMutator: Swap properties */
{
  1: "b",
  2: "a",
  3: "c"
};
a =
/* ObjectMutator: Swap properties */
{
  1: "c",
  2: "b",
  3: "a"
};
a =
/* ObjectMutator: Stringify a property key */
{
  "1": "a",
  2: "b",
  3: "c"
};
a =
/* ObjectMutator: Remove a property */
{
  2: "b",
  3: "c"
};
a =
/* ObjectMutator: Swap properties */
{
  1: "b",
  2: "a",
  3: "c"
};
a =
/* ObjectMutator: Duplicate a property value */
{
  1: "c",
  2: "b",
  3: "c"
};
a =
/* ObjectMutator: Duplicate a property value */
{
  1: "a",
  2: "b",
  3: "b"
};
a = {
  get bar() {
    return 0;
  },

  1: 0,

  set bar(t) {}

};
a =
/* ObjectMutator: Insert a random value */
{
  get bar() {
    return 0;
  },

  1: "",

  set bar(t) {}

};
a =
/* ObjectMutator: Remove a property */
{
  get bar() {
    return 0;
  },

  set bar(t) {}

};
a =
/* ObjectMutator: Duplicate a property value */
{
  1:
  /* ObjectMutator: Remove a property */
  {},
  2:
  /* ObjectMutator: Stringify a property key */
  {
    "3": "3"
  }
};
a =
/* ObjectMutator: Duplicate a property value */
{
  1:
  /* ObjectMutator: Swap properties */
  {
    4: "4",
    5: "6",
    6: "5"
  },
  2:
  /* ObjectMutator: Remove a property */
  {
    5: "5",
    6: "6"
  }
};
a =
/* ObjectMutator: Duplicate a property value */
{
  1:
  /* ObjectMutator: Swap properties */
  {
    4: "6",
    5: "5",
    6: "4"
  },
  2:
  /* ObjectMutator: Stringify a property key */
  {
    4: "4",
    5: "5",
    "6": "6"
  }
};
