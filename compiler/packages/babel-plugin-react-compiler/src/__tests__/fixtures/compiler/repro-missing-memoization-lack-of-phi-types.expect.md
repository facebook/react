
## Input

```javascript
// @flow @validatePreserveExistingMemoizationGuarantees
import {useMemo} from 'react';
import {useFragment} from 'shared-runtime';

function Component() {
  const data = useFragment();
  const nodes = data.nodes ?? [];
  const flatMap = nodes.flatMap(node => node.items);
  const filtered = flatMap.filter(item => item != null);
  const map = useMemo(() => filtered.map(), [filtered]);
  const index = filtered.findIndex(x => x === null);

  return (
    <div>
      {map}
      {index}
    </div>
  );
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useMemo } from "react";
import { useFragment } from "shared-runtime";

function Component() {
  const $ = _c(11);
  const data = useFragment();
  let t0;
  if ($[0] !== data.nodes) {
    t0 = data.nodes ?? [];
    $[0] = data.nodes;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const nodes = t0;
  let t1;
  if ($[2] !== nodes) {
    t1 = nodes.flatMap(_temp);
    $[2] = nodes;
    $[3] = t1;
  } else {
    t1 = $[3];
  }
  const flatMap = t1;
  let t2;
  if ($[4] !== flatMap) {
    t2 = flatMap.filter(_temp2);
    $[4] = flatMap;
    $[5] = t2;
  } else {
    t2 = $[5];
  }
  const filtered = t2;
  let t3;
  if ($[6] !== filtered) {
    t3 = filtered.map();
    $[6] = filtered;
    $[7] = t3;
  } else {
    t3 = $[7];
  }
  const map = t3;
  const index = filtered.findIndex(_temp3);
  let t4;
  if ($[8] !== index || $[9] !== map) {
    t4 = (
      <div>
        {map}
        {index}
      </div>
    );
    $[8] = index;
    $[9] = map;
    $[10] = t4;
  } else {
    t4 = $[10];
  }
  return t4;
}
function _temp3(x) {
  return x === null;
}
function _temp2(item) {
  return item != null;
}
function _temp(node) {
  return node.items;
}

```
      
### Eval output
(kind: exception) Fixture not implemented