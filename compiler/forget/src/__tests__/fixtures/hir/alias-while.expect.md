
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
function foo$0(cond$7) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== cond$7;
  let a$8;
  let b$9;
  let c$10;
  if (c_0) {
    a$8 = {};
    b$9 = {};
    c$10 = {};

    bb2: while (cond$7) {
      const z$13 = a$8;
      a$8 = b$9;
      b$9 = c$10;
      c$10 = z$13;
      mutate$6(a$8, b$9);
    }

    $[0] = cond$7;
    $[1] = a$8;
    $[2] = b$9;
    $[3] = c$10;
  } else {
    a$8 = $[1];
    b$9 = $[2];
    c$10 = $[3];
  }

  a$8;
  b$9;
  c$10;
  return a$8;
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
      