
## Input

```javascript
import {Stringify, identity, makeArray, toJSON} from 'shared-runtime';
import {useMemo} from 'react';

function Component(props) {
  const propsString = useMemo(() => toJSON(props), [props]);
  if (propsString.length <= 2) {
    return null;
  }

  const linkProps = {
    url: identity(propsString),
  };
  const x = {};

  // reactive scope ends at makeArray, as it is inferred as maybeMutate
  return (
    <Stringify
      link={linkProps}
      val1={[1]}
      val2={[2]}
      val3={[3]}
      val4={[4]}
      val5={[5]}>
      {makeArray(x, 2)}
    </Stringify>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{val: 2}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify, identity, makeArray, toJSON } from "shared-runtime";
import { useMemo } from "react";

function Component(props) {
  const $ = _c(13);
  let t0;
  let t1;
  let t2;
  if ($[0] !== props) {
    t2 = Symbol.for("react.early_return_sentinel");
    bb0: {
      t0 = toJSON(props);
      const propsString = t0;
      if (propsString.length <= 2) {
        t2 = null;
        break bb0;
      }

      t1 = identity(propsString);
    }
    $[0] = props;
    $[1] = t1;
    $[2] = t2;
    $[3] = t0;
  } else {
    t1 = $[1];
    t2 = $[2];
    t0 = $[3];
  }
  if (t2 !== Symbol.for("react.early_return_sentinel")) {
    return t2;
  }
  let t3;
  if ($[4] !== t1) {
    t3 = { url: t1 };
    $[4] = t1;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  const linkProps = t3;
  let t4;
  if ($[6] !== linkProps) {
    const x = {};
    let t5;
    let t6;
    let t7;
    let t8;
    let t9;
    if ($[8] === Symbol.for("react.memo_cache_sentinel")) {
      t5 = [1];
      t6 = [2];
      t7 = [3];
      t8 = [4];
      t9 = [5];
      $[8] = t5;
      $[9] = t6;
      $[10] = t7;
      $[11] = t8;
      $[12] = t9;
    } else {
      t5 = $[8];
      t6 = $[9];
      t7 = $[10];
      t8 = $[11];
      t9 = $[12];
    }
    t4 = (
      <Stringify
        link={linkProps}
        val1={t5}
        val2={t6}
        val3={t7}
        val4={t8}
        val5={t9}
      >
        {makeArray(x, 2)}
      </Stringify>
    );
    $[6] = linkProps;
    $[7] = t4;
  } else {
    t4 = $[7];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ val: 2 }],
};

```
      
### Eval output
(kind: ok) <div>{"link":{"url":"{\"val\":2}"},"val1":[1],"val2":[2],"val3":[3],"val4":[4],"val5":[5],"children":[{},2]}</div>