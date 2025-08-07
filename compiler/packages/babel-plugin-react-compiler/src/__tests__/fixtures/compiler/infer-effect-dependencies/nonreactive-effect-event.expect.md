
## Input

```javascript
// @inferEffectDependencies
import {useEffect, useEffectEvent, AUTODEPS} from 'react';
import {print} from 'shared-runtime';

/**
 * We do not include effect events in dep arrays.
 */
function NonReactiveEffectEvent() {
  const fn = useEffectEvent(() => print('hello world'));
  useEffect(() => fn(), AUTODEPS);
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @inferEffectDependencies
import { useEffect, useEffectEvent, AUTODEPS } from "react";
import { print } from "shared-runtime";

/**
 * We do not include effect events in dep arrays.
 */
function NonReactiveEffectEvent() {
  const $ = _c(2);
  const fn = useEffectEvent(_temp);
  let t0;
  if ($[0] !== fn) {
    t0 = () => fn();
    $[0] = fn;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  useEffect(t0, []);
}
function _temp() {
  return print("hello world");
}

```
      
### Eval output
(kind: exception) Fixture not implemented