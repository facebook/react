
## Input

```javascript
//@flow
import {useRef} from 'react';

component C() {
  const ref = useRef(null);
  if (ref.current == null) {
    ref.current = Date.now();
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

function C() {
  const ref = useRef(null);
  if (ref.current == null) {
    ref.current = Date.now();
  }
}

export const FIXTURE_ENTRYPOINT = {
  fn: C,
  params: [{}],
};

```
      
### Eval output
(kind: ok) 