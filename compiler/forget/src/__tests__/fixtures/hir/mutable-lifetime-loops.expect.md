
## Input

```javascript
function mutate(x, y) {}
function cond(x) {}

function Component(props) {
  let a = {};
  let b = {};
  let c = {};
  let d = {};
  while (true) {
    let z = a;
    a = b;
    b = c;
    c = d;
    d = z;
    mutate(a, b);
    if (cond(a)) {
      break;
    }
  }

  // all of these tests are seemingly readonly, since the values are never directly
  // mutated again. but they are all aliased by `d`, which is later modified, and
  // these are therefore mutable references:
  if (a) {
  }
  if (b) {
  }
  if (c) {
  }
  if (d) {
  }

  mutate(d, null);
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
  [1] Return
```

## Reactive Scopes

```
function cond(
  x,
) {
  return
}

```

## Code

```javascript
function cond$0(x$2) {}

```
## HIR

```
bb0:
  [1] Let mutate a$13_@0:TObject[1:23] = Object {  }
  [2] Let mutate b$14_@0:TObject[1:23] = Object {  }
  [3] Let mutate c$15_@0:TObject[1:23] = Object {  }
  [4] Let mutate d$16_@0:TObject[1:23] = Object {  }
  [5] Let mutate a$30_@0[1:23] = read a$13_@0:TObject
  [5] Let mutate b$31_@0[1:23] = read b$14_@0:TObject
  [5] Let mutate c$32_@0[1:23] = read c$15_@0:TObject
  [5] Let mutate d$33_@0[1:23] = read d$16_@0:TObject
  [5] While test=bb1 loop=bb3 fallthrough=bb2
bb1:
  predecessor blocks: bb0 bb4
  [6] Const mutate $17:TPrimitive = true
  [7] If (read $17:TPrimitive) then:bb3 else:bb2 fallthrough=bb2
bb3:
  predecessor blocks: bb1
  [8] Const mutate z$19_@0[1:23] = read a$13_@0:TObject
  [9] Reassign mutate a$13_@0:TObject[1:23] = read b$14_@0:TObject
  [10] Reassign mutate b$14_@0:TObject[1:23] = read c$15_@0:TObject
  [11] Reassign mutate c$15_@0:TObject[1:23] = read d$16_@0:TObject
  [12] Reassign mutate d$16_@0:TObject[1:23] = read z$19_@0
  [13] Call mutate mutate$7:TFunction(mutate a$13_@0:TObject, mutate b$14_@0:TObject)
  [14] Const mutate $29_@0[1:23] = Call mutate cond$8:TFunction(mutate a$13_@0:TObject)
  [15] Reassign mutate a$30_@0[1:23] = read a$13_@0:TObject
  [15] Reassign mutate b$31_@0[1:23] = read b$14_@0:TObject
  [15] Reassign mutate c$32_@0[1:23] = read c$15_@0:TObject
  [15] Reassign mutate d$33_@0[1:23] = read d$16_@0:TObject
  [15] If (read $29_@0) then:bb2 else:bb4 fallthrough=bb4
bb4:
  predecessor blocks: bb3
  [16] Goto(Continue) bb1
bb2:
  predecessor blocks: bb3 bb1
  [17] If (read a$30_@0) then:bb7 else:bb7 fallthrough=bb7
bb7:
  predecessor blocks: bb2
  [18] If (read b$31_@0) then:bb9 else:bb9 fallthrough=bb9
bb9:
  predecessor blocks: bb7
  [19] If (read c$32_@0) then:bb11 else:bb11 fallthrough=bb11
bb11:
  predecessor blocks: bb9
  [20] If (read d$33_@0) then:bb13 else:bb13 fallthrough=bb13
bb13:
  predecessor blocks: bb11
  [21] Const mutate $34:TPrimitive = null
  [22] Call mutate mutate$7:TFunction(mutate d$33_@0, read $34:TPrimitive)
  [23] Return
```

## Reactive Scopes

```
function Component(
  props,
) {
  [1] Let mutate a$13_@0:TObject[1:23] = Object {  }
  [2] Let mutate b$14_@0:TObject[1:23] = Object {  }
  [3] Let mutate c$15_@0:TObject[1:23] = Object {  }
  [4] Let mutate d$16_@0:TObject[1:23] = Object {  }
  [5] Let mutate a$30_@0[1:23] = read a$13_@0:TObject
  [5] Let mutate b$31_@0[1:23] = read b$14_@0:TObject
  [5] Let mutate c$32_@0[1:23] = read c$15_@0:TObject
  [5] Let mutate d$33_@0[1:23] = read d$16_@0:TObject
  while (
    [6] Const mutate $17:TPrimitive = true
    read $17:TPrimitive
  ) {
    [8] Const mutate z$19_@0[1:23] = read a$13_@0:TObject
    [9] Reassign mutate a$13_@0:TObject[1:23] = read b$14_@0:TObject
    [10] Reassign mutate b$14_@0:TObject[1:23] = read c$15_@0:TObject
    [11] Reassign mutate c$15_@0:TObject[1:23] = read d$16_@0:TObject
    [12] Reassign mutate d$16_@0:TObject[1:23] = read z$19_@0
    [13] Call mutate mutate$7:TFunction(mutate a$13_@0:TObject, mutate b$14_@0:TObject)
    [14] Const mutate $29_@0[1:23] = Call mutate cond$8:TFunction(mutate a$13_@0:TObject)
    [15] Reassign mutate a$30_@0[1:23] = read a$13_@0:TObject
    [15] Reassign mutate b$31_@0[1:23] = read b$14_@0:TObject
    [15] Reassign mutate c$32_@0[1:23] = read c$15_@0:TObject
    [15] Reassign mutate d$33_@0[1:23] = read d$16_@0:TObject
    if (read $29_@0) {
      break
    }
  }
  if (read a$30_@0) {
  }
  if (read b$31_@0) {
  }
  if (read c$32_@0) {
  }
  if (read d$33_@0) {
  }
  [21] Const mutate $34:TPrimitive = null
  [22] Call mutate mutate$7:TFunction(mutate d$33_@0, read $34:TPrimitive)
  return
}

```

## Code

```javascript
function Component$0(props$12) {
  let a$13 = {};
  let b$14 = {};
  let c$15 = {};
  let d$16 = {};
  let a$30 = a$13;
  let b$31 = b$14;
  let c$32 = c$15;
  let d$33 = d$16;
  while (true) {
    const z$19 = a$13;
    a$13 = b$14;
    b$14 = c$15;
    c$15 = d$16;
    d$16 = z$19;
    mutate$7(a$13, b$14);
    a$30 = a$13;
    b$31 = b$14;
    c$32 = c$15;
    d$33 = d$16;

    if (cond$8(a$13)) {
      break;
    }
  }

  if (a$30) {
  }

  if (b$31) {
  }

  if (c$32) {
  }

  if (d$33) {
  }

  mutate$7(d$33, null);
}

```
      