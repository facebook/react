
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
function Component$0() {
  const $ = React.useMemoCache();
  let a$5;
  if (true) {
    a$5 = [];
    $[0] = a$5;
  } else {
    a$5 = $[0];
  }

  const b$6 = a$5;
  useFreeze$3(a$5);
  foo$4(b$6);
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
function useFreeze$0() {}

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
function foo$0(x$2) {}

```
      