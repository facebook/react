
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees

import {useState} from 'react';

// Object mixing method shorthand and function expression properties
// should memoize entire object as a unit when deps change
function useMixed() {
  const [state, setState] = useState(0);
  return {
    // method shorthand
    getValue() {
      return state;
    },
    // arrow function property
    getValueArrow: () => state,
    // named function expression property
    getValueFn: function getValueFn() {
      return state;
    },
  };
}

export const FIXTURE_ENTRYPOINT = {
  fn: useMixed,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees

import { useState } from "react";

// Object mixing method shorthand and function expression properties
// should memoize entire object as a unit when deps change
function useMixed() {
  const $ = _c(2);
  const [state] = useState(0);
  let t0;
  if ($[0] !== state) {
    t0 = {
      getValue() {
        return state;
      },
      getValueArrow: () => state,
      getValueFn: function getValueFn() {
        return state;
      },
    };
    $[0] = state;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useMixed,
  params: [{}],
};

```
      
### Eval output
(kind: ok) {"getValue":"[[ function params=0 ]]","getValueArrow":"[[ function params=0 ]]","getValueFn":"[[ function params=0 ]]"}