
## Input

```javascript
function Component(c) {
  let x = { c };
  mutate(x);
  let a = x;
  let b = a;
}

```

## HIR

```
bb0:
  [1] Const mutate x$7_@0:TObject[1:3] = Object { c: read c$6 }
  [2] Call mutate mutate$3:TFunction(mutate x$7_@0:TObject)
  [3] Const mutate a$8:TObject = read x$7_@0:TObject
  [4] Const mutate b$9:TObject = read a$8:TObject
  [5] Return
scope0 [1:3]:
  - dependency: read c$6
```

## Reactive Scopes

```
function Component(
  c,
) {
  scope @0 [1:3] deps=[read c$6] {
    [1] Const mutate x$7_@0:TObject[1:3] = Object { c: read c$6 }
    [2] Call mutate mutate$3:TFunction(mutate x$7_@0:TObject)
  }
  [3] Const mutate a$8:TObject = read x$7_@0:TObject
  [4] Const mutate b$9:TObject = read a$8:TObject
  return
}

```

## Code

```javascript
function Component$0(c$6) {
  const x$7 = {
    c: c$6,
  };
  mutate$3(x$7);
  const a$8 = x$7;
  const b$9 = a$8;
}

```
      