
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
import { c as _c } from "react/compiler-runtime";
import { Stringify, identity, makeArray, toJSON } from "shared-runtime";
import { useMemo } from "react";

function Component(props) {
  const $ = _c(29);
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
  let T0;
  let t4;
  let t5;
  let t6;
  let t7;
  let t8;
  let t9;
  let t10;
  if ($[6] !== linkProps) {
    const x = {};

    T0 = Stringify;
    t4 = linkProps;
    if ($[15] === Symbol.for("react.memo_cache_sentinel")) {
      t5 = [1];
      t6 = [2];
      t7 = [3];
      t8 = [4];
      t9 = [5];
      $[15] = t5;
      $[16] = t6;
      $[17] = t7;
      $[18] = t8;
      $[19] = t9;
    } else {
      t5 = $[15];
      t6 = $[16];
      t7 = $[17];
      t8 = $[18];
      t9 = $[19];
    }

    t10 = makeArray(x, 2);
    $[6] = linkProps;
    $[7] = T0;
    $[8] = t4;
    $[9] = t5;
    $[10] = t6;
    $[11] = t7;
    $[12] = t8;
    $[13] = t9;
    $[14] = t10;
  } else {
    T0 = $[7];
    t4 = $[8];
    t5 = $[9];
    t6 = $[10];
    t7 = $[11];
    t8 = $[12];
    t9 = $[13];
    t10 = $[14];
  }
  let t11;
  if (
    $[20] !== T0 ||
    $[21] !== t4 ||
    $[22] !== t5 ||
    $[23] !== t6 ||
    $[24] !== t7 ||
    $[25] !== t8 ||
    $[26] !== t9 ||
    $[27] !== t10
  ) {
    t11 = (
      <T0 link={t4} val1={t5} val2={t6} val3={t7} val4={t8} val5={t9}>
        {t10}
      </T0>
    );
    $[20] = T0;
    $[21] = t4;
    $[22] = t5;
    $[23] = t6;
    $[24] = t7;
    $[25] = t8;
    $[26] = t9;
    $[27] = t10;
    $[28] = t11;
  } else {
    t11 = $[28];
  }
  return t11;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ val: 2 }],
};

```
      
### Eval output
(kind: ok) <div>{"link":{"url":"{\"val\":2}"},"val1":[1],"val2":[2],"val3":[3],"val4":[4],"val5":[5],"children":[{},2]}</div>