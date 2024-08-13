
## Input

```javascript
// @compilationMode(infer) @enableResetCacheOnSourceFileChanges
import {useEffect, useMemo, useState} from 'react';
import {ValidateMemoization} from 'shared-runtime';

let pretendConst = 0;

function unsafeResetConst() {
  pretendConst = 0;
}

function unsafeUpdateConst() {
  pretendConst += 1;
}

function Component() {
  useState(() => {
    // unsafe: reset the constant when first rendering the instance
    unsafeResetConst();
  });
  // UNSAFE! changing a module variable that is read by a component is normally
  // unsafe, but in this case we're simulating a fast refresh between each render
  unsafeUpdateConst();

  // TODO: In fast refresh mode (@enableResetCacheOnSourceFileChanges) Forget should
  // reset on changes to globals that impact the component/hook, effectively memoizing
  // as if value was reactive. However, we don't want to actually treat globals as
  // reactive (though that would be trivial) since it could change compilation too much
  // btw dev and prod. Instead, we should reset the cache via a secondary mechanism.
  const value = useMemo(() => [{pretendConst}], [pretendConst]);

  return <ValidateMemoization inputs={[pretendConst]} output={value} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
  sequentialRenders: [{}, {}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @compilationMode(infer) @enableResetCacheOnSourceFileChanges
import { useEffect, useMemo, useState } from "react";
import { ValidateMemoization } from "shared-runtime";

let pretendConst = 0;

function unsafeResetConst() {
  pretendConst = 0;
}

function unsafeUpdateConst() {
  pretendConst += 1;
}

function Component() {
  const $ = _c(3);
  if (
    $[0] !== "8d7015668f857996c3d895a7a90e3e16b8a791d5b9cd13f2c76e1c254aeedebb"
  ) {
    for (let $i = 0; $i < 3; $i += 1) {
      $[$i] = Symbol.for("react.memo_cache_sentinel");
    }
    $[0] = "8d7015668f857996c3d895a7a90e3e16b8a791d5b9cd13f2c76e1c254aeedebb";
  }
  useState(_temp);

  unsafeUpdateConst();
  let t0;
  let t1;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    t1 = [{ pretendConst }];
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  t0 = t1;
  const value = t0;
  let t2;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = <ValidateMemoization inputs={[pretendConst]} output={value} />;
    $[2] = t2;
  } else {
    t2 = $[2];
  }
  return t2;
}
function _temp() {
  unsafeResetConst();
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
  sequentialRenders: [{}, {}],
};

```
      