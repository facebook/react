
## Input

```javascript
import { Stringify } from "shared-runtime";

function Component({ useFeature }) {
  let x;
  if (useFeature) {
    x = [useFeature + useFeature].push(-useFeature);
  }
  let y = useFeature;
  let z = useFeature.useProperty;
  return (
    <Stringify val={useFeature}>
      {x}
      {y}
      {z}
    </Stringify>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ useFeature: { useProperty: true } }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
import { Stringify } from "shared-runtime";

function Component(t29) {
  const $ = useMemoCache(8);
  const { useFeature } = t29;
  let x;
  if (useFeature) {
    const t0 = useFeature + useFeature;
    let t1;
    if ($[0] !== t0 || $[1] !== useFeature) {
      t1 = [t0].push(-useFeature);
      $[0] = t0;
      $[1] = useFeature;
      $[2] = t1;
    } else {
      t1 = $[2];
    }
    x = t1;
  }

  const y = useFeature;
  const z = useFeature.useProperty;
  let t2;
  if ($[3] !== useFeature || $[4] !== x || $[5] !== y || $[6] !== z) {
    t2 = (
      <Stringify val={useFeature}>
        {x}
        {y}
        {z}
      </Stringify>
    );
    $[3] = useFeature;
    $[4] = x;
    $[5] = y;
    $[6] = z;
    $[7] = t2;
  } else {
    t2 = $[7];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ useFeature: { useProperty: true } }],
};

```
      
### Eval output
(kind: ok) <div>{"val":{"useProperty":true},"children":[2,"[[ cyclic ref *1 ]]",true]}</div>