
## Input

```javascript
function foo(a, b) {
  const x = [];
  x.push(a);
  <div>{x}</div>;

  const y = [];
  if (x.length) {
    y.push(x);
  }
  if (b) {
    y.push(b);
  }
}

```

## HIR

```
bb0:
  [1] Const mutate x$8_@0[1:3] = Array []
  [2] Call mutate x$8_@0.push(read a$6)
  [3] Const mutate $9:TPrimitive = "div"
  [4] JSX <read $9:TPrimitive>{freeze x$8_@0}</read $9:TPrimitive>
  [5] Const mutate y$10_@1[5:12] = Array []
  [6] If (read x$8_@0.length) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [7] Call mutate y$10_@1.push(read x$8_@0)
  [8] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [9] If (read b$7) then:bb4 else:bb3 fallthrough=bb3
bb4:
  predecessor blocks: bb1
  [10] Call mutate y$10_@1.push(read b$7)
  [11] Goto bb3
bb3:
  predecessor blocks: bb4 bb1
  [12] Return
```

## Reactive Scopes

```
function foo(
  a,
  b,
) {
  scope @0 [1:3] deps=[read a$6] out=[x$8_@0] {
    [1] Const mutate x$8_@0[1:3] = Array []
    [2] Call mutate x$8_@0.push(read a$6)
  }
  [3] Const mutate $9:TPrimitive = "div"
  [4] JSX <read $9:TPrimitive>{freeze x$8_@0}</read $9:TPrimitive>
  [5] Const mutate y$10_@1[5:12] = Array []
  if (read x$8_@0.length) {
    [7] Call mutate y$10_@1.push(read x$8_@0)
  }
  if (read b$7) {
    [10] Call mutate y$10_@1.push(read b$7)
  }
  return
}

```

## Code

```javascript
function foo(a, b) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    x = [];
    x.push(a);
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }

  <div>{x}</div>;
  const y = [];

  if (x.length) {
    y.push(x);
  }

  if (b) {
    y.push(b);
  }
}

```
      