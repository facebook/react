
## Input

```javascript
import {useState} from 'react';

type TestState = {
  test: string;
};

function Component() {
  const [test, setTest] = useState<TestState | null>(null);

  return (
    <>
      <button
        onClick={() =>
          test == null ? setTest({test: 'test'}) : setTest(null)
        }>
        Toggle
      </button>
      <button disabled={!test} onClick={() => console.log(test!.test)}>
        Print
      </button>
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useState } from "react";

type TestState = {
  test: string;
};

function Component() {
  const $ = _c(10);
  const [test, setTest] = useState(null);
  let t0;
  if ($[0] !== test) {
    t0 = (
      <button
        onClick={() =>
          test == null ? setTest({ test: "test" }) : setTest(null)
        }
      >
        Toggle
      </button>
    );
    $[0] = test;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  const t1 = !test;
  let t2;
  if ($[2] !== test) {
    t2 = () => console.log(test!.test);
    $[2] = test;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  let t3;
  if ($[4] !== t1 || $[5] !== t2) {
    t3 = (
      <button disabled={t1} onClick={t2}>
        Print
      </button>
    );
    $[4] = t1;
    $[5] = t2;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  let t4;
  if ($[7] !== t0 || $[8] !== t3) {
    t4 = (
      <>
        {t0}
        {t3}
      </>
    );
    $[7] = t0;
    $[8] = t3;
    $[9] = t4;
  } else {
    t4 = $[9];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <button>Toggle</button><button disabled="">Print</button>