
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
function mutate$0() {}

```
## HIR

```
bb0:
  [1] Const mutate a$5_@0:TObject = Object {  }
  [2] Const mutate b$6_@1:TObject[2:8] = Object {  }
  [3] Const mutate c$7_@1:TObject[2:8] = Object {  }
  [4] Const mutate a$8_@1:TObject[2:8] = read b$6_@1:TObject
  [5] Const mutate b$9_@1:TObject[2:8] = read c$7_@1:TObject
  [6] Const mutate c$10_@1:TObject[2:8] = read a$8_@1:TObject
  [7] Call mutate mutate$4:TFunction(mutate a$8_@1:TObject, mutate b$9_@1:TObject)
  [8] Return freeze c$10_@1:TObject
```

## Reactive Scopes

```
function foo(
) {
  [1] Const mutate a$5_@0:TObject = Object {  }
  scope @1 [2:8] deps=[] out=[c$10_@1] {
    [2] Const mutate b$6_@1:TObject[2:8] = Object {  }
    [3] Const mutate c$7_@1:TObject[2:8] = Object {  }
    [4] Const mutate a$8_@1:TObject[2:8] = read b$6_@1:TObject
    [5] Const mutate b$9_@1:TObject[2:8] = read c$7_@1:TObject
    [6] Const mutate c$10_@1:TObject[2:8] = read a$8_@1:TObject
    [7] Call mutate mutate$4:TFunction(mutate a$8_@1:TObject, mutate b$9_@1:TObject)
  }
  return freeze c$10_@1:TObject
}

```

## Code

```javascript
function foo$0() {
  const $ = React.useMemoCache();
  const a$5 = {};
  let c$10;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const b$6 = {};
    const c$7 = {};
    const a$8 = b$6;
    const b$9 = c$7;
    c$10 = a$8;
    mutate$4(a$8, b$9);
    $[0] = c$10;
  } else {
    c$10 = $[0];
  }

  return c$10;
}

```
      