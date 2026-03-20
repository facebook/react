
## Input

```javascript
import {Stringify} from 'shared-runtime';

/**
 * Bug: TypeScript assertion function pattern. `planPeriod.id` after the
 * assertion is used as a cache key, crashing when planPeriod is null.
 * The compiler doesn't understand that the assertion narrows the type.
 *
 * Related: https://github.com/facebook/react/issues/34752
 */
function assertIsNotEmpty<TValue>(
  value: TValue | null | undefined
): asserts value is TValue {
  if (value == null) throw new Error('assertion failure');
}

function Component({
  planPeriod,
}: {
  planPeriod: {id: string} | null;
}) {
  const callback = () => {
    assertIsNotEmpty(planPeriod?.id);
    console.log(planPeriod.id);
  };
  return <Stringify onClick={callback} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{planPeriod: {id: 'p1'}}],
  sequentialRenders: [{planPeriod: {id: 'p1'}}, {planPeriod: {id: 'p2'}}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

/**
 * Bug: TypeScript assertion function pattern. `planPeriod.id` after the
 * assertion is used as a cache key, crashing when planPeriod is null.
 * The compiler doesn't understand that the assertion narrows the type.
 *
 * Related: https://github.com/facebook/react/issues/34752
 */
function assertIsNotEmpty(value) {
  if (value == null) {
    throw new Error("assertion failure");
  }
}

function Component(t0) {
  const $ = _c(2);
  const { planPeriod } = t0;
  let t1;
  if ($[0] !== planPeriod) {
    const callback = () => {
      assertIsNotEmpty(planPeriod?.id);
      console.log(planPeriod.id);
    };
    t1 = <Stringify onClick={callback} />;
    $[0] = planPeriod;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ planPeriod: { id: "p1" } }],
  sequentialRenders: [
    { planPeriod: { id: "p1" } },
    { planPeriod: { id: "p2" } },
  ],
};

```
      
### Eval output
(kind: ok) <div>{"onClick":"[[ function params=0 ]]"}</div>
<div>{"onClick":"[[ function params=0 ]]"}</div>