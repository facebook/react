
## Input

```javascript
function mutate() {}
function foo() {
  let a = {};
  let b = {};
  let c = {};
  a = b;
  b = c;
  c = a;
  mutate(a, b);
  return c;
}

```

## HIR

```
bb0:
  [1] Return
```

## Reactive Scopes

```
function mutate(
) {
  return
}

```

## Code

```javascript
function mutate() {}

```
## HIR

```
bb0:
  [1] Const mutate a$5_@0:TObject = Object {  }
  [2] Const mutate b$6_@1:TObject[2:8] = Object {  }
  [3] Const mutate c$7_@1:TObject[2:8] = Object {  }
  [4] Const mutate a$0$8_@1:TObject[2:8] = read b$6_@1:TObject
  [5] Const mutate b$1$9_@1:TObject[2:8] = read c$7_@1:TObject
  [6] Const mutate c$2$10_@1:TObject[2:8] = read a$0$8_@1:TObject
  [7] Call mutate mutate$4:TFunction(mutate a$0$8_@1:TObject, mutate b$1$9_@1:TObject)
  [8] Return freeze c$2$10_@1:TObject
```

## Reactive Scopes

```
function foo(
) {
  [1] Const mutate a$5_@0:TObject = Object {  }
  scope @1 [2:8] deps=[] out=[c$2$10_@1] {
    [2] Const mutate b$6_@1:TObject[2:8] = Object {  }
    [3] Const mutate c$7_@1:TObject[2:8] = Object {  }
    [4] Const mutate a$0$8_@1:TObject[2:8] = read b$6_@1:TObject
    [5] Const mutate b$1$9_@1:TObject[2:8] = read c$7_@1:TObject
    [6] Const mutate c$2$10_@1:TObject[2:8] = read a$0$8_@1:TObject
    [7] Call mutate mutate$4:TFunction(mutate a$0$8_@1:TObject, mutate b$1$9_@1:TObject)
  }
  return freeze c$2$10_@1:TObject
}

```

## Code

```javascript
function foo() {
  const $ = React.useMemoCache();
  const a = {};
  let c$2;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const b = {};
    const c = {};
    const a$0 = b;
    const b$1 = c;
    c$2 = a$0;
    mutate(a$0, b$1);
    $[0] = c$2;
  } else {
    c$2 = $[0];
  }

  return c$2;
}

```
      