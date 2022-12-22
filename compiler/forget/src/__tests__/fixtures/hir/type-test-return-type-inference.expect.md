
## Input

```javascript
function component() {
  let x = foo();
  let y = foo();
  if (x > y) {
    let z = {};
  }

  let z = foo();
}

```

## HIR

```
bb0:
  [1] Const mutate x$7_@0:TPrimitive = Call mutate foo$1:TFunction()
  [2] Const mutate y$8_@1:TPrimitive = Call mutate foo$1:TFunction()
  [3] Const mutate $9:TPrimitive = Binary read x$7_@0:TPrimitive > read y$8_@1:TPrimitive
  [4] If (read $9:TPrimitive) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [5] Const mutate z$10_@2:TObject = Object {  }
  [6] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [7] Const mutate z$12_@3 = Call mutate foo$1:TFunction()
  [8] Return
```

## Reactive Scopes

```
function component(
) {
  scope @0 [1:2] deps=[] out=[x$7_@0] {
    [1] Const mutate x$7_@0:TPrimitive = Call mutate foo$1:TFunction()
  }
  scope @1 [2:3] deps=[] out=[y$8_@1] {
    [2] Const mutate y$8_@1:TPrimitive = Call mutate foo$1:TFunction()
  }
  [3] Const mutate $9:TPrimitive = Binary read x$7_@0:TPrimitive > read y$8_@1:TPrimitive
  if (read $9:TPrimitive) {
    [5] Const mutate z$10_@2:TObject = Object {  }
  }
  [7] Const mutate z$12_@3 = Call mutate foo$1:TFunction()
  return
}

```

## Code

```javascript
function component() {
  const $ = React.useMemoCache();
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = foo();
    $[0] = x;
  } else {
    x = $[0];
  }

  let y;

  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    y = foo();
    $[1] = y;
  } else {
    y = $[1];
  }

  if (x > y) {
    const z = {};
  }

  const z = foo();
}

```
      