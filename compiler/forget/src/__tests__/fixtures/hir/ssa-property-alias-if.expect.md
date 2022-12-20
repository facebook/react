
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
  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$6_@0:TObject[1:9] = Object {  }
  [2] If (read a$5) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate y$7_@1:TObject = Object {  }
  [4] Reassign mutate x$6_@0.y[1:9] = read y$7_@1:TObject
  [5] Goto bb1
bb3:
  predecessor blocks: bb0
  [6] Const mutate z$8_@2:TObject = Object {  }
  [7] Reassign mutate x$6_@0.z[1:9] = read z$8_@2:TObject
  [8] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [9] Return freeze x$6_@0:TObject
```

## Reactive Scopes

```
function foo(
  a,
) {
  scope @0 [1:9] deps=[read a$5] out=[x$6_@0] {
    [1] Const mutate x$6_@0:TObject[1:9] = Object {  }
    if (read a$5) {
      scope @1 [3:4] deps=[] out=[y$7_@1] {
        [3] Const mutate y$7_@1:TObject = Object {  }
      }
      [4] Reassign mutate x$6_@0.y[1:9] = read y$7_@1:TObject
    } else {
      scope @2 [6:7] deps=[] out=[z$8_@2] {
        [6] Const mutate z$8_@2:TObject = Object {  }
      }
      [7] Reassign mutate x$6_@0.z[1:9] = read z$8_@2:TObject
    }
  }
  return freeze x$6_@0:TObject
}

```

## Code

```javascript
function foo$0(a$5) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a$5;
  let x$6;
  if (c_0) {
    x$6 = {};

    if (a$5) {
      let y$7;

      if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
        y$7 = {};
        $[2] = y$7;
      } else {
        y$7 = $[2];
      }

      x$6.y = y$7;
    } else {
      let z$8;

      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        z$8 = {};
        $[3] = z$8;
      } else {
        z$8 = $[3];
      }

      x$6.z = z$8;
    }

    $[0] = a$5;
    $[1] = x$6;
  } else {
    x$6 = $[1];
  }

  return x$6;
}

```
      