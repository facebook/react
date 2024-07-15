
## Input

```javascript
import { Stringify } from "shared-runtime";

function Component(props) {
  return (
    <div>
      {props.items.map((item) => (
        <Stringify key={item.id} item={item.name} />
      ))}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ items: [{ id: 1, name: "one" }] }],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
import { Stringify } from "shared-runtime";

function Component(props) {
  const $ = _c(5);
  let t0;
  if ($[0] !== props.items) {
    let t1;
    if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
      t1 = (item) => <Stringify key={item.id} item={item.name} />;
      $[2] = t1;
    } else {
      t1 = $[2];
    }
    t0 = props.items.map(t1);
    $[0] = props.items;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  let t1;
  if ($[3] !== t0) {
    t1 = <div>{t0}</div>;
    $[3] = t0;
    $[4] = t1;
  } else {
    t1 = $[4];
  }
  return t1;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ items: [{ id: 1, name: "one" }] }],
};

```
      
### Eval output
(kind: ok) <div><div>{"item":"one"}</div></div>