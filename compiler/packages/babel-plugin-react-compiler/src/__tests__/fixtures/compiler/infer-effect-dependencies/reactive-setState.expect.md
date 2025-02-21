
## Input

```javascript
// @inferEffectDependencies
import {useEffect, useState} from 'react';
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
  useEffect(() => print(setState));
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @inferEffectDependencies
import { useEffect, useState } from "react";
import { print } from "shared-runtime";

/*
 * setState types are not enough to determine to omit from deps. Must also take reactivity into account.
 */
function ReactiveRefInEffect(props) {
  const $ = _c(2);
  const [, setState1] = useRef("initial value");
  const [, setState2] = useRef("initial value");
  let setState;
  if (props.foo) {
    setState = setState1;
  } else {
    setState = setState2;
  }
  let t0;
  if ($[0] !== setState) {
    t0 = () => print(setState);
    $[0] = setState;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  useEffect(t0, [setState]);
}

```
      
### Eval output
(kind: exception) Fixture not implemented