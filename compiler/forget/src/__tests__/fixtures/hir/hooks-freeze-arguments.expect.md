
## Input

```javascript
function Component() {
  const a = [];
  useFreeze(a); // should freeze
  useFreeze(a); // should be readonly
  call(a); // should be readonly
  return a;
}

function useFreeze(x) {}
function call(x) {}

```

## HIR

```
bb0:
  [1] Const mutate a$4_@0 = Array []
  [2] Call read useFreeze$2:TFunction(freeze a$4_@0)
  [3] Call read useFreeze$2:TFunction(read a$4_@0)
  [4] Call mutate call$3:TFunction(read a$4_@0)
  [5] Return read a$4_@0
```

## Reactive Scopes

```
function Component(
) {
  scope @0 [1:2] deps=[] out=[a$4_@0] {
    [1] Const mutate a$4_@0 = Array []
  }
  [2] Call read useFreeze$2:TFunction(freeze a$4_@0)
  [3] Call read useFreeze$2:TFunction(read a$4_@0)
  [4] Call mutate call$3:TFunction(read a$4_@0)
  return read a$4_@0
}

```

## Code

```javascript
function Component() {
  const $ = React.useMemoCache();
  let a;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a = [];
    $[0] = a;
  } else {
    a = $[0];
  }

  useFreeze(a);
  useFreeze(a);
  call(a);
  return a;
}

```
## HIR

```
bb0:
  [1] Return
```

## Reactive Scopes

```
function useFreeze(
  x,
) {
  return
}

```

## Code

```javascript
function useFreeze(x) {}

```
## HIR

```
bb0:
  [1] Return
```

## Reactive Scopes

```
function call(
  x,
) {
  return
}

```

## Code

```javascript
function call(x) {}

```
      