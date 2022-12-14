
## Input

```javascript
function component() {
  let p = makePrimitive();
  p + p; // infer p as primitive
  let o = {};

  let x = {};

  x.t = p; // infer x.t as primitive
  let z = x.t;

  x.t = o; // generalize x.t
  let y = x.t;
}

```

## HIR

```
bb0:
  [1] Const mutate p$7_@0:TPrimitive = Call mutate makePrimitive$2:TFunction()
  [2] Binary read p$7_@0:TPrimitive + read p$7_@0:TPrimitive
  [3] Const mutate o$8_@1:TObject = Object {  }
  [4] Const mutate x$9_@2:TObject[4:8] = Object {  }
  [5] Reassign mutate x$9_@2.t[4:8] = read p$7_@0:TPrimitive
  [6] Const mutate z$10_@2:TPrimitive[4:8] = read x$9_@2.t
  [7] Reassign mutate x$9_@2.t[4:8] = read o$8_@1:TObject
  [8] Const mutate y$11:TPoly = read x$9_@2.t
  [9] Return
```

## Reactive Scopes

```
function component(
) {
  scope @0 [1:2] deps=[] {
    [1] Const mutate p$7_@0:TPrimitive = Call mutate makePrimitive$2:TFunction()
  }
  [2] Binary read p$7_@0:TPrimitive + read p$7_@0:TPrimitive
  scope @1 [3:4] deps=[] {
    [3] Const mutate o$8_@1:TObject = Object {  }
  }
  scope @2 [4:8] deps=[read p$7_@0:TPrimitive, read o$8_@1:TObject] {
    [4] Const mutate x$9_@2:TObject[4:8] = Object {  }
    [5] Reassign mutate x$9_@2.t[4:8] = read p$7_@0:TPrimitive
    [6] Const mutate z$10_@2:TPrimitive[4:8] = read x$9_@2.t
    [7] Reassign mutate x$9_@2.t[4:8] = read o$8_@1:TObject
  }
  [8] Const mutate y$11:TPoly = read x$9_@2.t
  return
}

```

## Code

```javascript
function component$0() {
  const p$7 = makePrimitive$2();
  p$7 + p$7;
  const o$8 = {};
  const x$9 = {};
  x$9.t = p$7;
  const z$10 = x$9.t;
  x$9.t = o$8;
  const y$11 = x$9.t;
}

```
      