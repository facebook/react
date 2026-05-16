
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees:false
import {useState, useEffect} from 'react';

/**
 * Regression test for: React Compiler removes optional chaining due to
 * incorrect non-null assumption from a conditionally-called inner function
 * inside useEffect.
 *
 * The compiler was incorrectly assuming `currentDevice` is always non-null
 * because `currentDevice.os` is accessed inside `log()`. However, `log()` is
 * only called when `currentDevice` is truthy — so this access does NOT prove
 * non-nullability in the outer scope.
 *
 * The compiled output must preserve `currentDevice?.type` and
 * `currentDevice?.os` as optional chains.
 */
export default function Scanner() {
  const [devices, setDevices] = useState([]);
  const [currentDeviceIndex, setCurrentDeviceIndex] = useState(0);

  const currentDevice = devices[currentDeviceIndex];

  useEffect(() => {
    async function log() {
      console.log(currentDevice.os);
    }
    if (currentDevice) log();
  }, [currentDevice]);

  return (
    <div>
      device type:{' '}
      {currentDevice?.type ||
        (currentDevice?.os?.match(/android|ios/i) ? 'mobile' : 'desktop')}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Scanner,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees:false
import { useState, useEffect } from "react";

/**
 * Regression test for: React Compiler removes optional chaining due to
 * incorrect non-null assumption from a conditionally-called inner function
 * inside useEffect.
 *
 * The compiler was incorrectly assuming `currentDevice` is always non-null
 * because `currentDevice.os` is accessed inside `log()`. However, `log()` is
 * only called when `currentDevice` is truthy — so this access does NOT prove
 * non-nullability in the outer scope.
 *
 * The compiled output must preserve `currentDevice?.type` and
 * `currentDevice?.os` as optional chains.
 */
export default function Scanner() {
  const $ = _c(9);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = [];
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const [devices] = useState(t0);
  const [currentDeviceIndex] = useState(0);

  const currentDevice = devices[currentDeviceIndex];
  let t1;
  let t2;
  if ($[1] !== currentDevice) {
    t1 = () => {
      const log = async function log() {
        console.log(currentDevice.os);
      };
      if (currentDevice) {
        log();
      }
    };
    t2 = [currentDevice];
    $[1] = currentDevice;
    $[2] = t1;
    $[3] = t2;
  } else {
    t1 = $[2];
    t2 = $[3];
  }
  useEffect(t1, t2);
  let t3;
  if ($[4] !== currentDevice?.os || $[5] !== currentDevice?.type) {
    t3 =
      currentDevice?.type ||
      (currentDevice?.os?.match(/android|ios/i) ? "mobile" : "desktop");
    $[4] = currentDevice?.os;
    $[5] = currentDevice?.type;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  let t4;
  if ($[7] !== t3) {
    t4 = <div>device type: {t3}</div>;
    $[7] = t3;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Scanner,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div>device type: desktop</div>