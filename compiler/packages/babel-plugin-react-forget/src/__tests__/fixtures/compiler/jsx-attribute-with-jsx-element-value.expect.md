
## Input

```javascript
// @flow
function Component({ items }) {
  // Per the spec, <Foo value=<>{...}</> /> is valid.
  // But many tools don't allow fragments as jsx attribute values,
  // so we ensure not to emit them wrapped in an expression container
  return items.length > 0 ? (
    <Foo
      value={
        <Bar>
          {items.map((item) => (
            <Item key={item.id} item={item} />
          ))}
        </Bar>
      }
    ></Foo>
  ) : null;
}

function Foo({ value }) {
  return value;
}

function Bar({ children }) {
  return <div>{children}</div>;
}

function Item({ item }) {
  return <div>{item.name}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ items: [{ id: 1, name: "One!" }] }],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Component(t27) {
  const $ = useMemoCache(2);
  const { items } = t27;
  let t0;
  if ($[0] !== items) {
    t0 =
      items.length > 0 ? (
        <Foo
          value={
            <Bar>
              {items.map((item) => (
                <Item key={item.id} item={item} />
              ))}
            </Bar>
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

function Foo(t5) {
  const { value } = t5;
  return value;
}

function Bar(t6) {
  const $ = useMemoCache(2);
  const { children } = t6;
  let t0;
  if ($[0] !== children) {
    t0 = <div>{children}</div>;
    $[0] = children;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

function Item(t7) {
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
      