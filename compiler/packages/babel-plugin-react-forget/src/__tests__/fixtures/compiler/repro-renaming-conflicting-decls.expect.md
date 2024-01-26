
## Input

```javascript
import { Stringify, identity, makeArray, toJSON } from "shared-runtime";
import { useMemo } from "react";

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
      val5={[5]}
    >
      {makeArray(x, 2)}
    </Stringify>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ val: 2 }],
};

```

## Code

```javascript
import { Stringify, identity, makeArray, toJSON } from "shared-runtime";
import { useMemo, unstable_useMemoCache as useMemoCache } from "react";

function Component(props) {
  const $ = useMemoCache(29);
  let t10;
  let t0;
  let t92;
  if ($[0] !== props) {
    t92 = Symbol.for("react.early_return_sentinel");
    bb10: {
      t10 = toJSON(props);
      const propsString = t10;
      if (propsString.length <= 2) {
        t92 = null;
        break bb10;
      }

      t0 = identity(propsString);
    }
    $[0] = props;
    $[1] = t0;
    $[2] = t92;
    $[3] = t10;
  } else {
    t0 = $[1];
    t92 = $[2];
    t10 = $[3];
  }
  if (t92 !== Symbol.for("react.early_return_sentinel")) {
    return t92;
  }
  let t1;
  if ($[4] !== t0) {
    t1 = { url: t0 };
    $[4] = t0;
    $[5] = t1;
  } else {
    t1 = $[5];
  }
  const linkProps = t1;
  let T7;
  let t8;
  let t2;
  let t3;
  let t4;
  let t5;
  let t6;
  let t9;
  if ($[6] !== linkProps) {
    const x = {};

    T7 = Stringify;
    t8 = linkProps;
    if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
      t2 = [1];
      t3 = [2];
      t4 = [3];
      t5 = [4];
      t6 = [5];
      $[15] = t2;
      $[16] = t3;
      $[17] = t4;
      $[18] = t5;
      $[19] = t6;
    } else {
      t2 = $[15];
      t3 = $[16];
      t4 = $[17];
      t5 = $[18];
      t6 = $[19];
    }

    t9 = makeArray(x, 2);
    $[6] = linkProps;
    $[7] = T7;
    $[8] = t8;
    $[9] = t2;
    $[10] = t3;
    $[11] = t4;
    $[12] = t5;
    $[13] = t6;
    $[14] = t9;
  } else {
    T7 = $[7];
    t8 = $[8];
    t2 = $[9];
    t3 = $[10];
    t4 = $[11];
    t5 = $[12];
    t6 = $[13];
    t9 = $[14];
  }
  let t10$0;
  if (
    $[20] !== T7 ||
    $[21] !== t8 ||
    $[22] !== t2 ||
    $[23] !== t3 ||
    $[24] !== t4 ||
    $[25] !== t5 ||
    $[26] !== t6 ||
    $[27] !== t9
  ) {
    t10$0 = (
      <T7 link={t8} val1={t2} val2={t3} val3={t4} val4={t5} val5={t6}>
        {t9}
      </T7>
    );
    $[20] = T7;
    $[21] = t8;
    $[22] = t2;
    $[23] = t3;
    $[24] = t4;
    $[25] = t5;
    $[26] = t6;
    $[27] = t9;
    $[28] = t10$0;
  } else {
    t10$0 = $[28];
  }
  return t10$0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ val: 2 }],
};

```
      
### Eval output
(kind: ok) <div>{"link":{"url":"{\"val\":2}"},"val1":[1],"val2":[2],"val3":[3],"val4":[4],"val5":[5],"children":[{},2]}</div>