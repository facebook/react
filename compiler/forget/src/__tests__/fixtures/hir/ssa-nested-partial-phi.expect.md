
## Input

```javascript
function foo(a, b, c) {
  let x = a;
  if (b) {
    if (c) {
      x = c;
    }
    x;
  }
}

```

## HIR

```
bb0:
  [1] Const mutate x$8 = read a$5
  [2] If (read b$6) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Let mutate x$10_@0[1:6] = read x$8
  [3] If (read c$7) then:bb4 else:bb3 fallthrough=bb3
bb4:
  predecessor blocks: bb2
  [4] Const mutate x$9 = read c$7
  [5] Reassign mutate x$10_@0[1:6] = read x$9
  [5] Goto bb3
bb3:
  predecessor blocks: bb4 bb2
  [6] read x$10_@0
  [7] Goto bb1
bb1:
  predecessor blocks: bb3 bb0
  [8] Return
```

## Reactive Scopes

```
function foo(
  a,
  b,
  c,
) {
  [1] Const mutate x$8 = read a$5
  if (read b$6) {
    scope @0 [1:6] deps=[read c$7] out=[x$10_@0] {
      [3] Let mutate x$10_@0[1:6] = read x$8
      if (read c$7) {
        [4] Const mutate x$9 = read c$7
        [5] Reassign mutate x$10_@0[1:6] = read x$9
      }
    }
    [6] read x$10_@0
  }
  return
}

```

## Code

```javascript
function foo$0(a$5, b$6, c$7) {
  const $ = React.useMemoCache();
  const x$8 = a$5;
  if (b$6) {
    const c_0 = $[0] !== c$7;
    let x$10;

    if (c_0) {
      x$10 = x$8;

      if (c$7) {
        const x$9 = c$7;
        x$10 = x$9;
      }

      $[0] = c$7;
      $[1] = x$10;
    } else {
      x$10 = $[1];
    }

    x$10;
  }
}

```
      