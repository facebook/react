
## Input

```javascript
function foo(cond) {
  let a = {};
  let b = {};
  let c = {};
  while (cond) {
    let z = a;
    a = b;
    b = c;
    c = z;
    mutate(a, b);
  }
  a;
  b;
  c;
  return a;
}

function mutate(x, y) {}

```

## HIR

```
bb0:
  [1] Let mutate a$8_@0:TObject[1:12] = Object {  }
  [2] Let mutate b$9_@0:TObject[1:12] = Object {  }
  [3] Let mutate c$10_@0:TObject[1:12] = Object {  }
  [4] While test=bb1 loop=bb3 fallthrough=bb2
bb1:
  predecessor blocks: bb0 bb3
  [5] If (read cond$7) then:bb3 else:bb2 fallthrough=bb2
bb3:
  predecessor blocks: bb1
  [6] Const mutate z$13_@0[1:12] = read a$8_@0:TObject
  [7] Reassign mutate a$8_@0:TObject[1:12] = read b$9_@0:TObject
  [8] Reassign mutate b$9_@0:TObject[1:12] = read c$10_@0:TObject
  [9] Reassign mutate c$10_@0:TObject[1:12] = read z$13_@0
  [10] Call mutate mutate$6:TFunction(mutate a$8_@0:TObject, mutate b$9_@0:TObject)
  [11] Goto(Continue) bb1
bb2:
  predecessor blocks: bb1
  [12] read a$8_@0:TObject
  [13] read b$9_@0:TObject
  [14] read c$10_@0:TObject
  [15] Return freeze a$8_@0:TObject
```

## Reactive Scopes

```
function foo(
  cond,
) {
  scope @0 [1:12] deps=[read cond$7] out=[a$8_@0, b$9_@0, c$10_@0] {
    [1] Let mutate a$8_@0:TObject[1:12] = Object {  }
    [2] Let mutate b$9_@0:TObject[1:12] = Object {  }
    [3] Let mutate c$10_@0:TObject[1:12] = Object {  }
    while (
      read cond$7
    ) {
      [6] Const mutate z$13_@0[1:12] = read a$8_@0:TObject
      [7] Reassign mutate a$8_@0:TObject[1:12] = read b$9_@0:TObject
      [8] Reassign mutate b$9_@0:TObject[1:12] = read c$10_@0:TObject
      [9] Reassign mutate c$10_@0:TObject[1:12] = read z$13_@0
      [10] Call mutate mutate$6:TFunction(mutate a$8_@0:TObject, mutate b$9_@0:TObject)
    }
  }
  [12] read a$8_@0:TObject
  [13] read b$9_@0:TObject
  [14] read c$10_@0:TObject
  return freeze a$8_@0:TObject
}

```

## Code

```javascript
function foo(cond) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== cond;
  let a;
  let b;
  let c;
  if (c_0) {
    a = {};
    b = {};
    c = {};

    while (cond) {
      const z = a;
      a = b;
      b = c;
      c = z;
      mutate(a, b);
    }

    $[0] = cond;
    $[1] = a;
    $[2] = b;
    $[3] = c;
  } else {
    a = $[1];
    b = $[2];
    c = $[3];
  }

  a;
  b;
  c;
  return a;
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
function mutate(x, y) {}

```
      