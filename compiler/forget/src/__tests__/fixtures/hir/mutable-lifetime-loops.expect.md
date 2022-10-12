
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
  Let mutable a$2 = Object {  }
  Let mutable b$3 = Object {  }
  Let mutable c$4 = Object {  }
  Let mutable d$5 = Object {  }
  Goto bb1
bb1:
  Const mutable $10 = true
  If (readonly $10) then:bb3 else:bb2
bb3:
  Let mutable z$6 = readonly a$2
  Reassign mutable a$2 = readonly b$3
  Reassign mutable b$3 = readonly c$4
  Reassign mutable c$4 = readonly d$5
  Reassign mutable d$5 = readonly z$6
  Call mutable mutate$7(mutable a$2, mutable b$3)
  Const mutable $9 = Call mutable cond$8(mutable a$2)
  If (readonly $9) then:bb2 else:bb1
bb2:
  If (readonly a$2) then:bb7 else:bb7
bb7:
  If (readonly b$3) then:bb9 else:bb9
bb9:
  If (readonly c$4) then:bb11 else:bb11
bb11:
  If (readonly d$5) then:bb13 else:bb13
bb13:
  Const mutable $11 = null
  Call mutable mutate$7(mutable d$5, readonly $11)
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
      