
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
  const $ = _c(12);
  let t0;
  let t1;
  if ($[0] !== props) {
    t1 = Symbol.for("react.early_return_sentinel");
    bb0: {
      const propsString = toJSON(props);
      if (propsString.length <= 2) {
        t1 = null;
        break bb0;
      }

      t0 = identity(propsString);
    }
    $[0] = props;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  if (t1 !== Symbol.for("react.early_return_sentinel")) {
    return t1;
  }
  let t2;
  if ($[3] !== t0) {
    t2 = { url: t0 };
    $[3] = t0;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  const linkProps = t2;
  let t3;
  if ($[5] !== linkProps) {
    const x = {};
    let t4;
    let t5;
    let t6;
    let t7;
    let t8;
    if ($[7] === Symbol.for("react.memo_cache_sentinel")) {
      t4 = [1];
      t5 = [2];
      t6 = [3];
      t7 = [4];
      t8 = [5];
      $[7] = t4;
      $[8] = t5;
      $[9] = t6;
      $[10] = t7;
      $[11] = t8;
    } else {
      t4 = $[7];
      t5 = $[8];
      t6 = $[9];
      t7 = $[10];
      t8 = $[11];
    }
    t3 = (
      <Stringify
        link={linkProps}
        val1={t4}
        val2={t5}
        val3={t6}
        val4={t7}
        val5={t8}
      >
        {makeArray(x, 2)}
      </Stringify>
    );
    $[5] = linkProps;
    $[6] = t3;
  } else {
    t3 = $[6];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ val: 2 }],
};

```
      
### Eval output
(kind: ok) <div>{"link":{"url":"{\"val\":2}"},"val1":[1],"val2":[2],"val3":[3],"val4":[4],"val5":[5],"children":[{},2]}</div>