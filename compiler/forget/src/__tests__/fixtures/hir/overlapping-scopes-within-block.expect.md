
## Input

```javascript
function foo(a, b, c) {
  let x = [];
  if (a) {
    let y = [];
    if (b) {
      y.push(c);
    }

    x.push(y);
  }
  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$9_@0[1:9] = Array []
  [2] If (read a$6) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate y$10_@0[1:9] = Array []
  [4] If (read b$7) then:bb4 else:bb3 fallthrough=bb3
bb4:
  predecessor blocks: bb2
  [5] Call mutate y$10_@0.push(read c$8)
  [6] Goto bb3
bb3:
  predecessor blocks: bb4 bb2
  [7] Call mutate x$9_@0.push(mutate y$10_@0)
  [8] Goto bb1
bb1:
  predecessor blocks: bb3 bb0
  [9] Return freeze x$9_@0
```

## Reactive Scopes

```
function foo(
  a,
  b,
  c,
) {
  scope @0 [1:9] deps=[read a$6, read b$7, read c$8] out=[x$9_@0] {
    [1] Const mutate x$9_@0[1:9] = Array []
    if (read a$6) {
      [3] Const mutate y$10_@0[1:9] = Array []
      if (read b$7) {
        [5] Call mutate y$10_@0.push(read c$8)
      }
      [7] Call mutate x$9_@0.push(mutate y$10_@0)
    }
  }
  return freeze x$9_@0
}

```

## Code

```javascript
function foo(a, b, c) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  const c_2 = $[2] !== c;
  let x;
  if (c_0 || c_1 || c_2) {
    x = [];

    if (a) {
      const y = [];

      if (b) {
        y.push(c);
      }

      x.push(y);
    }

    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = x;
  } else {
    x = $[3];
  }

  return x;
}

```
      