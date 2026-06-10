
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees

import {useState} from 'react';

// Object with function expression properties - should be memoized
// identically to method shorthand objects
function useBug() {
  const [setNodes, setEdges] = useState(null);
  return {
    test1: () => {
      setNodes('test');
    },
    test2: function () {
      setEdges('test');
    },
  };
}

export const FIXTURE_ENTRYPOINT = {
  fn: useBug,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees

import { useState } from "react";

// Object with function expression properties - should be memoized
// identically to method shorthand objects
function useBug() {
  const $ = _c(2);
  const [setNodes, setEdges] = useState(null);
  let t0;
  if ($[0] !== setNodes) {
    t0 = {
      test1: () => {
        setNodes("test");
      },
      test2: function () {
        setEdges("test");
      },
    };
    $[0] = setNodes;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useBug,
  params: [{}],
};

```
      
### Eval output
(kind: ok) {"test1":"[[ function params=0 ]]","test2":"[[ function params=0 ]]"}