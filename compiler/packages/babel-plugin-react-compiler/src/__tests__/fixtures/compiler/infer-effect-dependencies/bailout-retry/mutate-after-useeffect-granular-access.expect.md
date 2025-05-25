
## Input

```javascript
// @inferEffectDependencies @panicThreshold:"none"
import {useEffect} from 'react';
import {print} from 'shared-runtime';

function Component({foo}) {
  const arr = [];
  // Taking either arr[0].value or arr as a dependency is reasonable
  // as long as developers know what to expect.
  useEffect(() => print(arr[0].value));
  arr.push({value: foo});
  return arr;
}

```

## Code

```javascript
// @inferEffectDependencies @panicThreshold:"none"
import { useEffect } from "react";
import { print } from "shared-runtime";

function Component(t0) {
  const { foo } = t0;
  const arr = [];

  useEffect(() => print(arr[0].value), [arr[0].value]);
  arr.push({ value: foo });
  return arr;
}

```
      
### Eval output
(kind: exception) Fixture not implemented