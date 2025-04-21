
## Input

```javascript
// @inferEffectDependencies @panicThreshold(none)

import {useEffect, useRef} from 'react';
import {print} from 'shared-runtime';

function Component({arrRef}) {
  // Avoid taking arr.current as a dependency
  useEffect(() => print(arrRef.current));
  arr.current.val = 2;
  return arr;
}

```

## Code

```javascript
// @inferEffectDependencies @panicThreshold(none)

import { useEffect, useRef } from "react";
import { print } from "shared-runtime";

function Component(t0) {
  const { arrRef } = t0;

  useEffect(() => print(arrRef.current), [arrRef]);
  arr.current.val = 2;
  return arr;
}

```
      
### Eval output
(kind: exception) Fixture not implemented