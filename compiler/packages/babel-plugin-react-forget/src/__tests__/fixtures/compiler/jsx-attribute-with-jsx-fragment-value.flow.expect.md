
## Input

```javascript
// @flow
function Component({items}) {
    // Per the spec, <Foo value=<>{...}</> /> is valid.
    // But many tools don't allow fragments as jsx attribute values,
    // so we ensure not to emit them wrapped in an expression container
    return items.length > 0
        ? (
            <Foo value={
                <>{items.map(item => <Bar key={item.id} item={item} />)}</>
            }></Foo>
        )
        : null;
}

function Foo({item}) {
    return <div>{item.name}</div>;
}

export const FIXTURE_ENTRYPOINT = {
    fn: Component,
    params: [{items: [{id: 1, name: 'One!'}]}],
};
```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(t26) {
  const $ = useMemoCache(2);
  const { items } = t26;
  let t0;
  if ($[0] !== items) {
    t0 =
      items.length > 0 ? (
        <Foo
          value={
            <>
              {items.map((item) => (
                <Bar key={item.id} item={item} />
              ))}
            </>
          }
        />
      ) : null;
    $[0] = items;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

function Foo(t7) {
  const $ = useMemoCache(2);
  const { item } = t7;
  let t0;
  if ($[0] !== item.name) {
    t0 = <div>{item.name}</div>;
    $[0] = item.name;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ items: [{ id: 1, name: "One!" }] }],
};

```
      