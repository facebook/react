
## Input

```javascript
function Component() {
  const a = [];
  const b = a;
  useFreeze(a);
  foo(b); // should be readonly, value is guaranteed frozen via alias
}

function useFreeze() {}
function foo(x) {}

```

## HIR

```
bb0:
  [1] Const mutate a$5_@0 = Array []
  [2] Const mutate b$6 = read a$5_@0
  [3] Call read useFreeze$3:TFunction(freeze a$5_@0)
  [4] Call mutate foo$4:TFunction(read b$6)
  [5] Return
```

## Reactive Scopes

```
function Component(
) {
  scope @0 [1:2] deps=[] out=[a$5_@0] {
    [1] Const mutate a$5_@0 = Array []
  }
  [2] Const mutate b$6 = read a$5_@0
  [3] Call read useFreeze$3:TFunction(freeze a$5_@0)
  [4] Call mutate foo$4:TFunction(read b$6)
  return
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

  const b = a;
  useFreeze(a);
  foo(b);
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
) {
  return
}

```

## Code

```javascript
function useFreeze() {}

```
## HIR

```
bb0:
  [1] Return
```

## Reactive Scopes

```
function foo(
  x,
) {
  return
}

```

## Code

```javascript
function foo(x) {}

```
      