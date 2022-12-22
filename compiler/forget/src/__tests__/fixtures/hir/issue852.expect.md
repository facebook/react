
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
```

## Reactive Scopes

```
function Component(
  c,
) {
  scope @0 [1:3] deps=[read c$6] out=[x$7_@0] {
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
function Component(c) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== c;
  let x;
  if (c_0) {
    x = {
      c: c,
    };
    mutate(x);
    $[0] = c;
    $[1] = x;
  } else {
    x = $[1];
  }

  const a = x;
  const b = a;
}

```
      