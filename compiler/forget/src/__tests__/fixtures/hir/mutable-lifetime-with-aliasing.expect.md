
## Input

```javascript
function mutate(x, y) {}

function Component(props) {
  const a = {};
  const b = [a]; // array elements alias
  const c = {};
  const d = { c }; // object values alias

  // capture all the values into this object
  const x = {};
  x.b = b;
  const y = mutate(x, d); // mutation aliases the arg and return value

  // all of these tests are seemingly readonly, since the values are never directly
  // mutated again. but they are all aliased by `x`, which is later modified, and
  // these are therefore mutable references:
  if (a) {
  }
  if (b) {
  }
  if (c) {
  }
  if (d) {
  }
  if (y) {
  }

  // could in theory mutate any of a/b/c/x/z, so the above should be inferred as mutable
  mutate(x, null);
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
  x,
  y,
) {
  return
}

```

## Code

```javascript
function mutate$0(x$3, y$4) {}

```
## HIR

```
bb0:
  [1] Const mutate a$11_@0:TObject = Object {  }
  [2] Const mutate b$12_@1[2:15] = Array [read a$11_@0:TObject]
  [3] Const mutate c$13_@2:TObject = Object {  }
  [4] Const mutate d$14_@1:TObject[2:15] = Object { c: read c$13_@2:TObject }
  [5] Const mutate x$15_@1:TObject[2:15] = Object {  }
  [6] Reassign store x$15_@1.b[2:15] = read b$12_@1
  [7] Const mutate y$16_@1[2:15] = Call mutate mutate$8:TFunction(mutate x$15_@1:TObject, mutate d$14_@1:TObject)
  [8] If (read a$11_@0:TObject) then:bb1 else:bb1 fallthrough=bb1
bb1:
  predecessor blocks: bb0
  [9] If (read b$12_@1) then:bb3 else:bb3 fallthrough=bb3
bb3:
  predecessor blocks: bb1
  [10] If (read c$13_@2:TObject) then:bb5 else:bb5 fallthrough=bb5
bb5:
  predecessor blocks: bb3
  [11] If (read d$14_@1:TObject) then:bb7 else:bb7 fallthrough=bb7
bb7:
  predecessor blocks: bb5
  [12] If (read y$16_@1) then:bb9 else:bb9 fallthrough=bb9
bb9:
  predecessor blocks: bb7
  [13] Const mutate $17:TPrimitive = null
  [14] Call mutate mutate$8:TFunction(mutate x$15_@1:TObject, read $17:TPrimitive)
  [15] Return
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:2] deps=[] out=[a$11_@0] {
    [1] Const mutate a$11_@0:TObject = Object {  }
  }
  [2] Const mutate b$12_@1[2:15] = Array [read a$11_@0:TObject]
  scope @2 [3:4] deps=[] out=[c$13_@2] {
    [3] Const mutate c$13_@2:TObject = Object {  }
  }
  [4] Const mutate d$14_@1:TObject[2:15] = Object { c: read c$13_@2:TObject }
  [5] Const mutate x$15_@1:TObject[2:15] = Object {  }
  [6] Reassign store x$15_@1.b[2:15] = read b$12_@1
  [7] Const mutate y$16_@1[2:15] = Call mutate mutate$8:TFunction(mutate x$15_@1:TObject, mutate d$14_@1:TObject)
  if (read a$11_@0:TObject) {
  }
  if (read b$12_@1) {
  }
  if (read c$13_@2:TObject) {
  }
  if (read d$14_@1:TObject) {
  }
  if (read y$16_@1) {
  }
  [13] Const mutate $17:TPrimitive = null
  [14] Call mutate mutate$8:TFunction(mutate x$15_@1:TObject, read $17:TPrimitive)
  return
}

```

## Code

```javascript
function Component$0(props$10) {
  const $ = React.useMemoCache();
  let a$11;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    a$11 = {};
    $[0] = a$11;
  } else {
    a$11 = $[0];
  }

  const b$12 = [a$11];
  let c$13;

  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    c$13 = {};
    $[1] = c$13;
  } else {
    c$13 = $[1];
  }

  const d$14 = {
    c: c$13,
  };
  const x$15 = {};
  x$15.b = b$12;
  const y$16 = mutate$8(x$15, d$14);

  if (a$11) {
  }

  if (b$12) {
  }

  if (c$13) {
  }

  if (d$14) {
  }

  if (y$16) {
  }

  mutate$8(x$15, null);
}

```
      