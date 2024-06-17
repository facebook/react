
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
  const $ = _c(3);
  const { id } = t0;

  const t1 = id ? true : false;
  let t2;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t2 = <Stringify title={undefined} />;
    $[0] = t2;
  } else {
    t2 = $[0];
  }
  let t3;
  if ($[1] !== t1) {
    t3 = (
      <>
        {t2}
        <Stringify title={t1} />
      </>
    );
    $[1] = t1;
    $[2] = t3;
  } else {
    t3 = $[2];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{}],
};

```
      
### Eval output
(kind: ok) <div>{}</div><div>{"title":false}</div>