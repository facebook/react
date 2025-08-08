
## Input

```javascript
// @inferEffectDependencies
import {useEffect, useState, AUTODEPS} from 'react';
import {print} from 'shared-runtime';

/*
 * setState types are not enough to determine to omit from deps. Must also take reactivity into account.
 */
function ReactiveRefInEffect(props) {
  const [_state1, setState1] = useRef('initial value');
  const [_state2, setState2] = useRef('initial value');
  let setState;
  if (props.foo) {
    setState = setState1;
  } else {
    setState = setState2;
  }
  useEffect(() => print(setState), AUTODEPS);
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @inferEffectDependencies
import { useEffect, useState, AUTODEPS } from "react";
import { print } from "shared-runtime";

/*
 * setState types are not enough to determine to omit from deps. Must also take reactivity into account.
 */
function ReactiveRefInEffect(props) {
  const $ = _c(4);
  const [, setState1] = useRef("initial value");
  const [, setState2] = useRef("initial value");
  let setState;
  if ($[0] !== props.foo) {
    if (props.foo) {
      setState = setState1;
    } else {
      setState = setState2;
    }
    $[0] = props.foo;
    $[1] = setState;
  } else {
    setState = $[1];
  }
  let t0;
  if ($[2] !== setState) {
    t0 = () => print(setState);
    $[2] = setState;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  useEffect(t0, [setState]);
}

```
      
### Eval output
(kind: exception) Fixture not implemented