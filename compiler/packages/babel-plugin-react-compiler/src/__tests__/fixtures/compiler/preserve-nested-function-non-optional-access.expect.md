
## Input

```javascript
// Test that optional chaining is still removed when appropriate.
// When a nested function is unconditionally called (e.g., as a JSX prop handler),
// and the variable is accessed non-optionally, we should still optimize away the ?. 

import {useState} from 'react';

function Component({device}) {
  const [count, setCount] = useState(0);
  
  // This handler is unconditionally passed to onClick
  const handleClick = () => {
    console.log(device.type);  // this is safe to access directly
    console.log(device.id);
  };
  
  return (
    <div>
      <button onClick={handleClick}>Click {count}</button>
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{device: {type: 'phone', id: 123}}],
  isComponent: true,
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // Test that optional chaining is still removed when appropriate.
// When a nested function is unconditionally called (e.g., as a JSX prop handler),
// and the variable is accessed non-optionally, we should still optimize away the ?.

import { useState } from "react";

function Component(t0) {
  const $ = _c(5);
  const { device } = t0;
  const [count] = useState(0);
  let t1;
  if ($[0] !== device) {
    t1 = () => {
      console.log(device.type);
      console.log(device.id);
    };
    $[0] = device;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  const handleClick = t1;
  let t2;
  if ($[2] !== count || $[3] !== handleClick) {
    t2 = (
      <div>
        <button onClick={handleClick}>Click {count}</button>
      </div>
    );
    $[2] = count;
    $[3] = handleClick;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ device: { type: "phone", id: 123 } }],
  isComponent: true,
};

```
      
### Eval output
(kind: ok) <div><button>Click 0</button></div>