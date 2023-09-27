
## Input

```javascript
function Foo(props) {
  return (
    <>
      Hello {props.greeting}{" "}
      <div>
        <>Text</>
      </div>
    </>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Foo(props) {
  const $ = useMemoCache(4);
  let t0;
  let t1;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <>Text</>;
    t1 = <div>{t0}</div>;
    $[0] = t0;
    $[1] = t1;
  } else {
    t0 = $[0];
    t1 = $[1];
  }
  const c_2 = $[2] !== props.greeting;
  let t2;
  if (c_2) {
    t2 = (
      <>
        Hello {props.greeting}
        {t1}
      </>
    );
    $[2] = props.greeting;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  return t2;
}
export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};

```
      