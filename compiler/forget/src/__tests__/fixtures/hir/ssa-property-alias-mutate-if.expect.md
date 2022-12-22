
## Input

```javascript
function foo(a) {
  const x = {};
  if (a) {
    let y = {};
    x.y = y;
  } else {
    let z = {};
    x.z = z;
  }
  mutate(x);
  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$7_@0:TObject[1:10] = Object {  }
  [2] If (read a$6) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate y$8_@0:TObject[1:10] = Object {  }
  [4] Reassign store x$7_@0.y[1:10] = read y$8_@0:TObject
  [5] Goto bb1
bb3:
  predecessor blocks: bb0
  [6] Const mutate z$9_@0:TObject[1:10] = Object {  }
  [7] Reassign store x$7_@0.z[1:10] = read z$9_@0:TObject
  [8] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [9] Call mutate mutate$5:TFunction(mutate x$7_@0:TObject)
  [10] Return freeze x$7_@0:TObject
```

## Reactive Scopes

```
function foo(
  a,
) {
  scope @0 [1:10] deps=[read a$6] out=[x$7_@0] {
    [1] Const mutate x$7_@0:TObject[1:10] = Object {  }
    if (read a$6) {
      [3] Const mutate y$8_@0:TObject[1:10] = Object {  }
      [4] Reassign store x$7_@0.y[1:10] = read y$8_@0:TObject
    } else {
      [6] Const mutate z$9_@0:TObject[1:10] = Object {  }
      [7] Reassign store x$7_@0.z[1:10] = read z$9_@0:TObject
    }
    [9] Call mutate mutate$5:TFunction(mutate x$7_@0:TObject)
  }
  return freeze x$7_@0:TObject
}

```

## Code

```javascript
function foo(a) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a;
  let x;
  if (c_0) {
    x = {};

    if (a) {
      const y = {};
      x.y = y;
    } else {
      const z = {};
      x.z = z;
    }

    mutate(x);
    $[0] = a;
    $[1] = x;
  } else {
    x = $[1];
  }

  return x;
}

```
      