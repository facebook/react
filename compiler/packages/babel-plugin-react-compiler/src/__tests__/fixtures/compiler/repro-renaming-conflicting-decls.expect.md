
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
  const $ = _c(15);
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
  let t5;
  let t6;
  let t7;
  let t8;
  let t9;
  if ($[6] === Symbol.for("react.memo_cache_sentinel")) {
    const x = {};

    t4 = [1];
    t5 = [2];
    t6 = [3];
    t7 = [4];
    t8 = [5];

    t9 = makeArray(x, 2);
    $[6] = t4;
    $[7] = t5;
    $[8] = t6;
    $[9] = t7;
    $[10] = t8;
    $[11] = t9;
  } else {
    t4 = $[6];
    t5 = $[7];
    t6 = $[8];
    t7 = $[9];
    t8 = $[10];
    t9 = $[11];
  }
  let t10;
  if ($[12] !== linkProps || $[13] !== t9) {
    t10 = (
      <Stringify
        link={linkProps}
        val1={t4}
        val2={t5}
        val3={t6}
        val4={t7}
        val5={t8}
      >
        {t9}
      </Stringify>
    );
    $[12] = linkProps;
    $[13] = t9;
    $[14] = t10;
  } else {
    t10 = $[14];
  }
  return t10;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ val: 2 }],
};

```
      
### Eval output
(kind: ok) <div>{"link":{"url":"{\"val\":2}"},"val1":[1],"val2":[2],"val3":[3],"val4":[4],"val5":[5],"children":[{},2]}</div>