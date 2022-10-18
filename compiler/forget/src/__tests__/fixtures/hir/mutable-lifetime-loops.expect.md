
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
function mutate$0(x$1, y$2) {
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
function cond$0(x$1) {
  return;
}

```
## HIR

```
bb0:
  Let mutate a$2 = Object {  }
  Let mutate b$3 = Object {  }
  Let mutate c$4 = Object {  }
  Let mutate d$5 = Object {  }
  Goto bb1
bb1:
  predecessor blocks: bb0 bb3
  Const mutate $10 = true
  If (read $10) then:bb3 else:bb2
bb3:
  predecessor blocks: bb1
  Let mutate z$6 = read a$2
  Reassign mutate a$2 = read b$3
  Reassign mutate b$3 = read c$4
  Reassign mutate c$4 = read d$5
  Reassign mutate d$5 = read z$6
  Call mutate mutate$7(mutate a$2, mutate b$3)
  Const mutate $9 = Call mutate cond$8(mutate a$2)
  If (read $9) then:bb2 else:bb1
bb2:
  predecessor blocks: bb1 bb3
  If (read a$2) then:bb7 else:bb7
bb7:
  predecessor blocks: bb2
  If (read b$3) then:bb9 else:bb9
bb9:
  predecessor blocks: bb7
  If (read c$4) then:bb11 else:bb11
bb11:
  predecessor blocks: bb9
  If (read d$5) then:bb13 else:bb13
bb13:
  predecessor blocks: bb11
  Const mutate $11 = null
  Call mutate mutate$7(mutate d$5, read $11)
  Return
```

## Code

```javascript
function Component$0(props$1) {
  let a$2 = {};
  let b$3 = {};
  let c$4 = {};
  let d$5 = {};
  ("<<TODO: handle complex control flow in codegen>>");
}

```
      