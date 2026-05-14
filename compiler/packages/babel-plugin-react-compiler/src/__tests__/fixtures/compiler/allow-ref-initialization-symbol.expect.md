
## Input

```javascript
//@flow
import {useRef} from 'react';

const UNINITIALIZED = Symbol();

component C() {
  const r = useRef(UNINITIALIZED);
  if (r.current === UNINITIALIZED) {
    r.current = 1;
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: C,
  params: [{}],
};

```

## Code

```javascript
import { useRef } from "react";

const UNINITIALIZED = Symbol();

function C() {
  const r = useRef(UNINITIALIZED);
  if (r.current === UNINITIALIZED) {
    r.current = 1;
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: C,
  params: [{}],
};

```
      
### Eval output
(kind: ok) 