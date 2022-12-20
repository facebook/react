
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
  [2] Let mutate x$15_@0[1:8] = read x$12:TPrimitive
  [2] If (read a$7) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate x$13 = read b$8
  [4] Reassign mutate x$15_@0[1:8] = read x$13
  [4] Goto bb1
bb3:
  predecessor blocks: bb0
  [5] If (read c$9) then:bb5 else:bb1 fallthrough=bb1
bb5:
  predecessor blocks: bb3
  [6] Const mutate x$14 = read d$10
  [7] Reassign mutate x$15_@0[1:8] = read x$14
  [7] Goto bb1
bb1:
  predecessor blocks: bb2 bb5 bb3
  [8] Return read x$15_@0
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
  scope @0 [1:8] deps=[read a$7, read b$8, read c$9, read d$10] out=[x$15_@0] {
    [2] Let mutate x$15_@0[1:8] = read x$12:TPrimitive
    if (read a$7) {
      [3] Const mutate x$13 = read b$8
      [4] Reassign mutate x$15_@0[1:8] = read x$13
    } else {
      if (read c$9) {
        [6] Const mutate x$14 = read d$10
        [7] Reassign mutate x$15_@0[1:8] = read x$14
      }
    }
  }
  return read x$15_@0
}

```

## Code

```javascript
function foo$0(a$7, b$8, c$9, d$10, e$11) {
  const $ = React.useMemoCache();
  const x$12 = null;
  const c_0 = $[0] !== a$7;
  const c_1 = $[1] !== b$8;
  const c_2 = $[2] !== c$9;
  const c_3 = $[3] !== d$10;
  let x$15;
  if (c_0 || c_1 || c_2 || c_3) {
    x$15 = x$12;

    if (a$7) {
      const x$13 = b$8;
      x$15 = x$13;
    } else {
      if (c$9) {
        const x$14 = d$10;
        x$15 = x$14;
      }
    }

    $[0] = a$7;
    $[1] = b$8;
    $[2] = c$9;
    $[3] = d$10;
    $[4] = x$15;
  } else {
    x$15 = $[4];
  }

  return x$15;
}

```
      