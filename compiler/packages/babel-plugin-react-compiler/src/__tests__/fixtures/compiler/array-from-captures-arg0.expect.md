
## Input

```javascript
import {useIdentity, Stringify} from 'shared-runtime';

/**
 * TODO: Note that this `Array.from` is inferred to be mutating its first
 * argument. This is because React Compiler's typing system does not yet support
 * annotating a function with a set of argument match cases + distinct
 * definitions (polymorphism)
 *
 * In this case, we should be able to infer that the `Array.from` call is
 * not mutating its 0th argument.
 * The 0th argument should be typed as having `effect:Mutate` only when
 * (1) it might be a mutable iterable or
 * (2) the 1st argument might mutate its callee
 */
function Component({value}) {
  const arr = [{value: 'foo'}, {value: 'bar'}, {value}];
  useIdentity();
  const derived = Array.from(arr);
  return <Stringify>{derived.at(-1)}</Stringify>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 5}],
  sequentialRenders: [{value: 5}, {value: 6}, {value: 6}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useIdentity, Stringify } from "shared-runtime";

/**
 * TODO: Note that this `Array.from` is inferred to be mutating its first
 * argument. This is because React Compiler's typing system does not yet support
 * annotating a function with a set of argument match cases + distinct
 * definitions (polymorphism)
 *
 * In this case, we should be able to infer that the `Array.from` call is
 * not mutating its 0th argument.
 * The 0th argument should be typed as having `effect:Mutate` only when
 * (1) it might be a mutable iterable or
 * (2) the 1st argument might mutate its callee
 */
function Component(t0) {
  const $ = _c(4);
  const { value } = t0;
  const arr = [{ value: "foo" }, { value: "bar" }, { value }];
  useIdentity();
  const derived = Array.from(arr);
  let t1;
  if ($[0] !== derived) {
    t1 = derived.at(-1);
    $[0] = derived;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  let t2;
  if ($[2] !== t1) {
    t2 = <Stringify>{t1}</Stringify>;
    $[2] = t1;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: 5 }],
  sequentialRenders: [{ value: 5 }, { value: 6 }, { value: 6 }],
};

```
      
### Eval output
(kind: ok) <div>{"children":{"value":5}}</div>
<div>{"children":{"value":6}}</div>
<div>{"children":{"value":6}}</div>