
## Input

```javascript
function component() {
  let x = { u: makeSomePrimitive(), v: makeSomePrimitive() };
  let u = x.u;
  let v = x.v;
  if (u > v) {
  }

  let y = x.u;
  let z = x.v;
}

```

## HIR

```
bb0:
  [1] Const mutate $10_@0:TPrimitive = Call mutate makeSomePrimitive$2:TFunction()
  [2] Const mutate $11_@1:TPrimitive = Call mutate makeSomePrimitive$2:TFunction()
  [3] Const mutate x$12_@2:TObject = Object { u: read $10_@0:TPrimitive, v: read $11_@1:TPrimitive }
  [4] Const mutate u$13_@3:TPrimitive = read x$12_@2.u
  [5] Const mutate v$14_@4:TPrimitive = read x$12_@2.v
  [6] Const mutate $15_@5:TPrimitive = Binary read u$13_@3:TPrimitive > read v$14_@4:TPrimitive
  [7] If (read $15_@5:TPrimitive) then:bb1 else:bb1 fallthrough=bb1
bb1:
  predecessor blocks: bb0
  [8] Const mutate y$16_@6:TPrimitive = read x$12_@2.u
  [9] Const mutate z$17_@7:TPrimitive = read x$12_@2.v
  [10] Return
scope2 [3:4]:
  - dependency: read $10_@0:TPrimitive
  - dependency: read $11_@1:TPrimitive
scope3 [4:5]:
  - dependency: read x$12_@2.u
scope4 [5:6]:
  - dependency: read x$12_@2.v
scope5 [6:7]:
  - dependency: read u$13_@3:TPrimitive
  - dependency: read v$14_@4:TPrimitive
scope6 [8:9]:
  - dependency: read x$12_@2.u
scope7 [9:10]:
  - dependency: read x$12_@2.v
```

## Reactive Scopes

```
function component(
) {
  scope @0 [1:2] deps=[] {
    [1] Const mutate $10_@0:TPrimitive = Call mutate makeSomePrimitive$2:TFunction()
  }
  scope @1 [2:3] deps=[] {
    [2] Const mutate $11_@1:TPrimitive = Call mutate makeSomePrimitive$2:TFunction()
  }
  scope @2 [3:4] deps=[read $10_@0:TPrimitive, read $11_@1:TPrimitive] {
    [3] Const mutate x$12_@2:TObject = Object { u: read $10_@0:TPrimitive, v: read $11_@1:TPrimitive }
  }
  [4] Const mutate u$13_@3:TPrimitive = read x$12_@2.u
  [5] Const mutate v$14_@4:TPrimitive = read x$12_@2.v
  [6] Const mutate $15_@5:TPrimitive = Binary read u$13_@3:TPrimitive > read v$14_@4:TPrimitive
  if (read $15_@5:TPrimitive) {
  }
  [8] Const mutate y$16_@6:TPrimitive = read x$12_@2.u
  [9] Const mutate z$17_@7:TPrimitive = read x$12_@2.v
  return
}

```

## Code

```javascript
function component$0() {
  const x$12 = {
    u: makeSomePrimitive$2(),
    v: makeSomePrimitive$2(),
  };
  const u$13 = x$12.u;
  const v$14 = x$12.v;
  bb1: if (u$13 > v$14) {
  }

  const y$16 = x$12.u;
  const z$17 = x$12.v;
}

```
      