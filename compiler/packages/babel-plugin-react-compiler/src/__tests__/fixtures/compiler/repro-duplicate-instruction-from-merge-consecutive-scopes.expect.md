
## Input

```javascript
import { Stringify } from "shared-runtime";

function Component({ id }) {
  const bar = (() => {})();

  return (
    <>
      <Stringify title={bar} />
      <Stringify title={id ? true : false} />
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
import { Stringify } from "shared-runtime";

function Component(t0) {
  const $ = _c(5);
  const { id } = t0;

  const t1 = id ? true : false;
  let t2;
  if ($[0] !== t1) {
    t2 = <Stringify title={t1} />;
    $[0] = t1;
    $[1] = t2;
  } else {
    t2 = $[1];
  }
  let t3;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t3 = <Stringify title={undefined} />;
    $[2] = t3;
  } else {
    t3 = $[2];
  }
  let t4;
  if ($[3] !== t2) {
    t4 = (
      <>
        {t3}
        {t2}
      </>
    );
    $[3] = t2;
    $[4] = t4;
  } else {
    t4 = $[4];
  }
  return t4;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div>{}</div><div>{"title":false}</div>