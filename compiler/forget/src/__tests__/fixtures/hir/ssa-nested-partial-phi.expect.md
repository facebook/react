
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
  [3] Let mutate x$0$10_@0[1:6] = read x$8
  [3] If (read c$7) then:bb4 else:bb3 fallthrough=bb3
bb4:
  predecessor blocks: bb2
  [4] Const mutate x$1$9 = read c$7
  [5] Reassign mutate x$0$10_@0[1:6] = read x$1$9
  [5] Goto bb3
bb3:
  predecessor blocks: bb4 bb2
  [6] read x$0$10_@0
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
    scope @0 [1:6] deps=[read c$7] out=[x$0$10_@0] {
      [3] Let mutate x$0$10_@0[1:6] = read x$8
      if (read c$7) {
        [4] Const mutate x$1$9 = read c$7
        [5] Reassign mutate x$0$10_@0[1:6] = read x$1$9
      }
    }
    [6] read x$0$10_@0
  }
  return
}

```

## Code

```javascript
function foo(a, b, c) {
  const $ = React.useMemoCache();
  const x = a;
  if (b) {
    const c_0 = $[0] !== c;
    let x$0;

    if (c_0) {
      x$0 = x;

      if (c) {
        const x$1 = c;
        x$0 = x$1;
      }

      $[0] = c;
      $[1] = x$0;
    } else {
      x$0 = $[1];
    }

    x$0;
  }
}

```
      