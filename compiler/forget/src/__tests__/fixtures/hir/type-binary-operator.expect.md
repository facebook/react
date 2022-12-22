
## Input

```javascript
function component() {
  let a = some();
  let b = someOther();
  if (a > b) {
    let m = {};
  }
}

```

## HIR

```
bb0:
  [1] Const mutate a$7_@0:TPrimitive = Call mutate some$1:TFunction()
  [2] Const mutate b$8_@1:TPrimitive = Call mutate someOther$3:TFunction()
  [3] Const mutate $9:TPrimitive = Binary read a$7_@0:TPrimitive > read b$8_@1:TPrimitive
  [4] If (read $9:TPrimitive) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [5] Const mutate m$10_@2:TObject = Object {  }
  [6] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [7] Return
```

## Reactive Scopes

```
function component(
) {
  scope @0 [1:2] deps=[] out=[a$7_@0] {
    [1] Const mutate a$7_@0:TPrimitive = Call mutate some$1:TFunction()
  }
  scope @1 [2:3] deps=[] out=[b$8_@1] {
    [2] Const mutate b$8_@1:TPrimitive = Call mutate someOther$3:TFunction()
  }
  [3] Const mutate $9:TPrimitive = Binary read a$7_@0:TPrimitive > read b$8_@1:TPrimitive
  if (read $9:TPrimitive) {
    [5] Const mutate m$10_@2:TObject = Object {  }
  }
  return
}

```

## Code

```javascript
function component() {
  const $ = React.useMemoCache();
  let a;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a = some();
    $[0] = a;
  } else {
    a = $[0];
  }

  let b;

  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    b = someOther();
    $[1] = b;
  } else {
    b = $[1];
  }

  if (a > b) {
    const m = {};
  }
}

```
      