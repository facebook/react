
## Input

```javascript
// @validateNoSetStateInRender
import {useState} from 'react';

function Component() {
  const [total, setTotal] = useState(0);
  setTotal(42);
  return total;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  isComponent: true,
};

```

## Code

```javascript
// @validateNoSetStateInRender
import { useState } from "react";

function Component() {
  const [total, setTotal] = useState(0);
  setTotal(42);
  return total;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  isComponent: true,
};

```
      
### Eval output
(kind: exception) Too many re-renders. React limits the number of renders to prevent an infinite loop.