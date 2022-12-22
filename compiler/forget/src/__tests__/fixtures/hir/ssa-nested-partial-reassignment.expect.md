
## Input

```javascript
function foo(a, b, c, d, e) {
  let x = null;
  if (a) {
    x = b;
  } else {
    if (c) {
      x = d;
    }
  }
  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$12:TPrimitive = null
  [2] Let mutate x$0$15_@0[1:8] = read x$12:TPrimitive
  [2] If (read a$7) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate x$1$13 = read b$8
  [4] Reassign mutate x$0$15_@0[1:8] = read x$1$13
  [4] Goto bb1
bb3:
  predecessor blocks: bb0
  [5] If (read c$9) then:bb5 else:bb1 fallthrough=bb1
bb5:
  predecessor blocks: bb3
  [6] Const mutate x$2$14 = read d$10
  [7] Reassign mutate x$0$15_@0[1:8] = read x$2$14
  [7] Goto bb1
bb1:
  predecessor blocks: bb2 bb5 bb3
  [8] Return read x$0$15_@0
```

## Reactive Scopes

```
function foo(
  a,
  b,
  c,
  d,
  e,
) {
  [1] Const mutate x$12:TPrimitive = null
  scope @0 [1:8] deps=[read a$7, read b$8, read c$9, read d$10] out=[x$0$15_@0] {
    [2] Let mutate x$0$15_@0[1:8] = read x$12:TPrimitive
    if (read a$7) {
      [3] Const mutate x$1$13 = read b$8
      [4] Reassign mutate x$0$15_@0[1:8] = read x$1$13
    } else {
      if (read c$9) {
        [6] Const mutate x$2$14 = read d$10
        [7] Reassign mutate x$0$15_@0[1:8] = read x$2$14
      }
    }
  }
  return read x$0$15_@0
}

```

## Code

```javascript
function foo(a, b, c, d, e) {
  const $ = React.useMemoCache();
  const x = null;
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  const c_2 = $[2] !== c;
  const c_3 = $[3] !== d;
  let x$0;
  if (c_0 || c_1 || c_2 || c_3) {
    x$0 = x;

    if (a) {
      const x$1 = b;
      x$0 = x$1;
    } else {
      if (c) {
        const x$2 = d;
        x$0 = x$2;
      }
    }

    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = d;
    $[4] = x$0;
  } else {
    x$0 = $[4];
  }

  return x$0;
}

```
      