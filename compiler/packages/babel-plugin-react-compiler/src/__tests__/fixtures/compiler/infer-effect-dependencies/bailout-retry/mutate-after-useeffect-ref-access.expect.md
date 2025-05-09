
## Input

```javascript
// @inferEffectDependencies @panicThreshold:"none"

import {useEffect, useRef} from 'react';
import {print} from 'shared-runtime';

function Component({arrRef}) {
  // Avoid taking arr.current as a dependency
  useEffect(() => print(arrRef.current));
  arrRef.current.val = 2;
  return arrRef;
}

```

## Code

```javascript
// @inferEffectDependencies @panicThreshold:"none"

import { useEffect, useRef } from "react";
import { print } from "shared-runtime";

function Component(t0) {
  const { arrRef } = t0;

  useEffect(() => print(arrRef.current), [arrRef]);
  arrRef.current.val = 2;
  return arrRef;
}

```
      
### Eval output
(kind: exception) Fixture not implemented