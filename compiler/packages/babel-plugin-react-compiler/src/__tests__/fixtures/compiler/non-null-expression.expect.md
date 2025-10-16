
## Input

```javascript
import {useState} from 'react';

function Component() {
  const [value, setValue] = useState(null);
  const createValue = () => {
    setValue({value: 42});
  };
  const logValue = () => {
    console.log(value!.value);
  };
  return (
    <>
      <button onClick={createValue} />
      <button disabled={value == null} onClick={logValue} />
    </>
  );
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { useState } from "react";

function Component() {
  const $ = _c(7);
  const [value, setValue] = useState(null);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = () => {
      setValue({ value: 42 });
    };
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const createValue = t0;
  let t1;
  if ($[1] !== value) {
    t1 = () => {
      console.log(value!.value);
    };
    $[1] = value;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  const logValue = t1;
  let t2;
  if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = <button onClick={createValue} />;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const t3 = value == null;
  let t4;
  if ($[4] !== logValue || $[5] !== t3) {
    t4 = (
      <>
        {t2}
        <button disabled={t3} onClick={logValue} />
      </>
    );
    $[4] = logValue;
    $[5] = t3;
    $[6] = t4;
  } else {
    t4 = $[6];
  }
  return t4;
}

```
      
### Eval output
(kind: exception) Fixture not implemented