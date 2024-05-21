
## Input

```javascript
import React from "react";
import { useState } from "react";

const CONST = true;

let NON_REASSIGNED_LET = true;

let REASSIGNED_LET = false;
REASSIGNED_LET = true;

function reassignedFunction() {}
reassignedFunction = true;

function nonReassignedFunction() {}

class ReassignedClass {}
ReassignedClass = true;

class NonReassignedClass {}

function Component() {
  const [state] = useState(null);
  return [
    React,
    state,
    CONST,
    NON_REASSIGNED_LET,
    REASSIGNED_LET,
    reassignedFunction,
    nonReassignedFunction,
    ReassignedClass,
    NonReassignedClass,
  ];
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import React from "react";
import { useState } from "react";

const CONST = true;

let NON_REASSIGNED_LET = true;

let REASSIGNED_LET = false;
REASSIGNED_LET = true;

function reassignedFunction() {}
reassignedFunction = true;

function nonReassignedFunction() {}

class ReassignedClass {}
ReassignedClass = true;

class NonReassignedClass {}

function Component() {
  const $ = _c(2);
  const [state] = useState(null);
  let t0;
  if ($[0] !== state) {
    t0 = [
      React,

      state,
      CONST,
      NON_REASSIGNED_LET,
      REASSIGNED_LET,
      reassignedFunction,
      nonReassignedFunction,
      ReassignedClass,
      NonReassignedClass,
    ];
    $[0] = state;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      
### Eval output
(kind: exception) Fixture not implemented