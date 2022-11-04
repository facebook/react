
## Input

```javascript
function mutate() {}
function cond() {}

function Component(props) {
  let a = {};
  let b = {};
  let c = {};
  let d = {};
  while (true) {
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
function mutate$0() {
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
function cond$0() {
  return;
}

```
## HIR

```
bb0:
  [1] Let mutate a$12 = Object {  }
  [2] Let mutate b$13 = Object {  }
  [3] Let mutate c$14 = Object {  }
  [4] Let mutate d$15 = Object {  }
  Goto bb1
bb1:
  predecessor blocks: bb0 bb3
  mutate$17[-1:9]: phi(bb0: mutate$6, bb3: mutate$17)
  a$18[-1:7]: phi(bb0: a$12, bb3: a$18)
  b$19[-1:6]: phi(bb0: b$13, bb3: b$19)
  cond$20[-1:7]: phi(bb0: cond$7, bb3: cond$20)
  c$25: phi(bb0: c$14, bb3: c$25)
  d$27[-1:9]: phi(bb0: d$15, bb3: d$27)
  [5] Const mutate $16 = true
  If (read $16) then:bb3 else:bb2
bb3:
  predecessor blocks: bb1
  [6] Call mutate mutate$17(mutate a$18, mutate b$19)
  [7] Const mutate $21 = Call mutate cond$20(mutate a$18)
  If (read $21) then:bb2 else:bb1
bb2:
  predecessor blocks: bb1 bb3
  If (read a$18) then:bb7 else:bb7
bb7:
  predecessor blocks: bb2
  If (read b$19) then:bb9 else:bb9
bb9:
  predecessor blocks: bb7
  If (read c$25) then:bb11 else:bb11
bb11:
  predecessor blocks: bb9
  If (read d$27) then:bb13 else:bb13
bb13:
  predecessor blocks: bb11
  [8] Const mutate $28 = null
  [9] Call mutate mutate$17(mutate d$27, read $28)
  Return
```

## Code

```javascript
function Component$0(props$11) {
  let a$12 = {};
  let b$13 = {};
  let c$14 = {};
  let d$15 = {};
  ("<<TODO: handle complex control flow in codegen>>");
}

```
      