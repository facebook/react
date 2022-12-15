
## Input

```javascript
function foo(a, b, c) {
  let x = [];
  let y = [];
  while (c) {
    y.push(b);
    x.push(a);
  }
}

```

## HIR

```
bb0:
  [1] Const mutate x$9_@0:TFunction[1:8] = Array []
  [2] Const mutate y$10_@0:TFunction[1:8] = Array []
  [3] While test=bb1 loop=bb3 fallthrough=bb2
bb1:
  predecessor blocks: bb0 bb3
  [4] If (read c$8) then:bb3 else:bb2 fallthrough=bb2
bb3:
  predecessor blocks: bb1
  [5] Call mutate y$10_@0.push(read b$7)
  [6] Call mutate x$9_@0.push(read a$6)
  [7] Goto(Continue) bb1
bb2:
  predecessor blocks: bb1
  [8] Return
```

## Reactive Scopes

```
function foo(
  a,
  b,
  c,
) {
  scope @0 [1:8] deps=[read c$8, read b$7, read a$6] out=[] {
    [1] Const mutate x$9_@0:TFunction[1:8] = Array []
    [2] Const mutate y$10_@0:TFunction[1:8] = Array []
    while (
      read c$8
    ) {
      [5] Call mutate y$10_@0.push(read b$7)
      [6] Call mutate x$9_@0.push(read a$6)
    }
  }
  return
}

```

## Code

```javascript
function foo$0(a$6, b$7, c$8) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== c$8;
  const c_1 = $[1] !== b$7;
  const c_2 = $[2] !== a$6;
  if (c_0 || c_1 || c_2) {
    const x$9 = [];
    const y$10 = [];

    bb2: while (c$8) {
      y$10.push(b$7);
      x$9.push(a$6);
    }

    $[0] = c$8;
    $[1] = b$7;
    $[2] = a$6;
  } else {
  }
}

```
      