
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
  Return
```

## Code

```javascript
function mutate$0(x$3, y$4) {
  return;
}

```
## HIR

```
bb0:
  Return
```

## Code

```javascript
function cond$0(x$2) {
  return;
}

```
## HIR

```
bb0:
  [1] Let mutate a$13 = Object {  }
  [2] Let mutate b$14 = Object {  }
  [3] Let mutate c$15 = Object {  }
  [4] Let mutate d$16 = Object {  }
  Goto bb1
bb1:
  predecessor blocks: bb0 bb3
  a$18: phi(bb0: a$13, bb3: a$21)
  b$20: phi(bb0: b$14, bb3: b$23)
  c$22: phi(bb0: c$15, bb3: c$25)
  d$24: phi(bb0: d$16, bb3: d$26)
  mutate$27: phi(bb0: mutate$7, bb3: mutate$27)
  cond$28: phi(bb0: cond$8, bb3: cond$28)
  [5] Const mutate $17 = true
  If (read $17) then:bb3 else:bb2
bb3:
  predecessor blocks: bb1
  [6] Let mutate z$19 = read a$18
  [7] Reassign mutate a$21 = read b$20
  [8] Reassign mutate b$23 = read c$22
  [9] Reassign mutate c$25 = read d$24
  [10] Reassign mutate d$26 = read z$19
  [11] Call mutate mutate$27(mutate a$21, mutate b$23)
  [12] Const mutate $29 = Call mutate cond$28(mutate a$21)
  If (read $29) then:bb2 else:bb1
bb2:
  predecessor blocks: bb1 bb3
  a$30: phi(bb1: a$18, bb3: a$21)
  b$31: phi(bb1: b$20, bb3: b$23)
  c$32: phi(bb1: c$22, bb3: c$25)
  d$33: phi(bb1: d$24, bb3: d$26)
  If (read a$30) then:bb7 else:bb7
bb7:
  predecessor blocks: bb2
  If (read b$31) then:bb9 else:bb9
bb9:
  predecessor blocks: bb7
  If (read c$32) then:bb11 else:bb11
bb11:
  predecessor blocks: bb9
  If (read d$33) then:bb13 else:bb13
bb13:
  predecessor blocks: bb11
  [13] Const mutate $34 = null
  [14] Call mutate mutate$27(mutate d$33, read $34)
  Return
```

## Code

```javascript
function Component$0(props$12) {
  let a$13 = {};
  let b$14 = {};
  let c$15 = {};
  let d$16 = {};
  ("<<TODO: handle complex control flow in codegen>>");
}

```
      