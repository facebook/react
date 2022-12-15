
## Input

```javascript
function f(a, b) {
  let x = []; // <- x starts being mutable here.
  if (a.length === 1) {
    if (b) {
      x.push(b); // <- x stops being mutable here.
    }
  }

  return <div>{x}</div>;
}

```

## HIR

```
bb0:
  [1] Const mutate x$10_@0:TFunction[1:8] = Array []
  [2] Const mutate $11:TPrimitive = 1
  [3] Const mutate $12:TPrimitive = Binary read a$8.length === read $11:TPrimitive
  [4] If (read $12:TPrimitive) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [5] If (read b$9) then:bb4 else:bb1 fallthrough=bb1
bb4:
  predecessor blocks: bb2
  [6] Call mutate x$10_@0.push(read b$9)
  [7] Goto bb1
bb1:
  predecessor blocks: bb4 bb2 bb0
  [8] Const mutate $13:TPrimitive = "div"
  [9] Const mutate t4$15_@1 = JSX <read $13:TPrimitive>{freeze x$10_@0:TFunction}</read $13:TPrimitive>
  [10] Return read t4$15_@1
```

## Reactive Scopes

```
function f(
  a,
  b,
) {
  scope @0 [1:8] deps=[read a$8.length, read b$9] out=[x$10_@0] {
    [1] Const mutate x$10_@0:TFunction[1:8] = Array []
    [2] Const mutate $11:TPrimitive = 1
    [3] Const mutate $12:TPrimitive = Binary read a$8.length === read $11:TPrimitive
    if (read $12:TPrimitive) {
      if (read b$9) {
        [6] Call mutate x$10_@0.push(read b$9)
      }
    }
  }
  [8] Const mutate $13:TPrimitive = "div"
  scope @1 [9:10] deps=[freeze x$10_@0:TFunction] out=[$15_@1] {
    [9] Const mutate $15_@1 = JSX <read $13:TPrimitive>{freeze x$10_@0:TFunction}</read $13:TPrimitive>
  }
  return read $15_@1
}

```

## Code

```javascript
function f$0(a$8, b$9) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a$8.length;
  const c_1 = $[1] !== b$9;
  let x$10;
  if (c_0 || c_1) {
    x$10 = [];

    bb1: if (a$8.length === 1) {
      if (b$9) {
        x$10.push(b$9);
      }
    }

    $[0] = a$8.length;
    $[1] = b$9;
    $[2] = x$10;
  } else {
    x$10 = $[2];
  }

  const c_3 = $[3] !== x$10;
  let t4$15;

  if (c_3) {
    t4$15 = <div>{x$10}</div>;
    $[3] = x$10;
    $[4] = t4$15;
  } else {
    t4$15 = $[4];
  }

  return t4$15;
}

```
      