
## Input

```javascript
// @inferEffectDependencies
import {useEffect, useRef} from 'react';
import {print} from 'shared-runtime';

/*
 * Ref types are not enough to determine to omit from deps. Must also take reactivity into account.
 */
function ReactiveRefInEffect(props) {
  const ref1 = useRef('initial value');
  const ref2 = useRef('initial value');
  let ref;
  if (props.foo) {
    ref = ref1;
  } else {
    ref = ref2;
  }
  useEffect(() => print(ref));
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @inferEffectDependencies
import { useEffect, useRef } from "react";
import { print } from "shared-runtime";

/*
 * Ref types are not enough to determine to omit from deps. Must also take reactivity into account.
 */
function ReactiveRefInEffect(props) {
  const $ = _c(4);
  const ref1 = useRef("initial value");
  const ref2 = useRef("initial value");
  let ref;
  if ($[0] !== props.foo) {
    if (props.foo) {
      ref = ref1;
    } else {
      ref = ref2;
    }
    $[0] = props.foo;
    $[1] = ref;
  } else {
    ref = $[1];
  }
  let t0;
  if ($[2] !== ref) {
    t0 = () => print(ref);
    $[2] = ref;
    $[3] = t0;
  } else {
    t0 = $[3];
  }
  useEffect(t0, [ref]);
}

```
      
### Eval output
(kind: exception) Fixture not implemented