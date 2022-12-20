
## Input

```javascript
function Component(props) {
  const a = 1;
  const b = 2;
  const x = { a: a, b: b };
  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate a$6:TPrimitive = 1
  [2] Const mutate b$7:TPrimitive = 2
  [3] Const mutate x$8_@0:TObject = Object { a: read a$6:TPrimitive, b: read b$7:TPrimitive }
  [4] Return freeze x$8_@0:TObject
```

## Reactive Scopes

```
function Component(
  props,
) {
  [1] Const mutate a$6:TPrimitive = 1
  [2] Const mutate b$7:TPrimitive = 2
  scope @0 [3:4] deps=[] out=[x$8_@0] {
    [3] Const mutate x$8_@0:TObject = Object { a: read a$6:TPrimitive, b: read b$7:TPrimitive }
  }
  return freeze x$8_@0:TObject
}

```

## Code

```javascript
function Component$0(props$5) {
  const $ = React.useMemoCache();
  const a$6 = 1;
  const b$7 = 2;
  let x$8;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x$8 = {
      a: a$6,
      b: b$7,
    };
    $[0] = x$8;
  } else {
    x$8 = $[0];
  }

  return x$8;
}

```
      