
## Input

```javascript
function foo() {
  let x = 1;
  if (x === 1) {
    x = 2;
  }

  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$4:TPrimitive = 1
  [2] Const mutate $5:TPrimitive = 1
  [3] Const mutate $6:TPrimitive = Binary read x$4:TPrimitive === read $5:TPrimitive
  [4] Let mutate x$8_@0[1:7] = read x$4:TPrimitive
  [4] If (read $6:TPrimitive) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [5] Const mutate x$7:TPrimitive = 2
  [6] Reassign mutate x$8_@0[1:7] = read x$7:TPrimitive
  [6] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [7] Return read x$8_@0
```

## Reactive Scopes

```
function foo(
) {
  [1] Const mutate x$4:TPrimitive = 1
  [2] Const mutate $5:TPrimitive = 1
  [3] Const mutate $6:TPrimitive = Binary read x$4:TPrimitive === read $5:TPrimitive
  scope @0 [1:7] deps=[] out=[x$8_@0] {
    [4] Let mutate x$8_@0[1:7] = read x$4:TPrimitive
    if (read $6:TPrimitive) {
      [5] Const mutate x$7:TPrimitive = 2
      [6] Reassign mutate x$8_@0[1:7] = read x$7:TPrimitive
    }
  }
  return read x$8_@0
}

```

## Code

```javascript
function foo$0() {
  const $ = React.useMemoCache();
  const x$4 = 1;
  let x$8;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x$8 = x$4;

    if (x$4 === 1) {
      const x$7 = 2;
      x$8 = x$7;
    }

    $[0] = x$8;
  } else {
    x$8 = $[0];
  }

  return x$8;
}

```
      