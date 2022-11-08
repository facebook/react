
## Input

```javascript
function And() {
  return f() && g();
}

function Or() {
  return f() || g();
}

function QuestionQuestion(props) {
  return f() ?? g();
}

function f() {}
function g() {}

```

## HIR

```
bb0:
  [1] Const mutate $5 = Call mutate f$1()
  If (read $5) then:bb2 else:bb3
bb2:
  predecessor blocks: bb0
  [2] Const mutate $6 = Call mutate g$4()
  Goto bb1
bb3:
  predecessor blocks: bb0
  [3] Const mutate $7 = read $5
  Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  $8: phi(bb2: $6, bb3: $7)
  Return freeze $8
```

## Code

```javascript
function And$0() {
  if (f$1()) {
    ("<<TODO: handle complex control flow in codegen>>");
  } else {
    ("<<TODO: handle complex control flow in codegen>>");
  }
  return t8;
}

```
## HIR

```
bb0:
  [1] Const mutate $5 = Call mutate f$1()
  If (read $5) then:bb2 else:bb3
bb2:
  predecessor blocks: bb0
  [2] Const mutate $6 = read $5
  Goto bb1
bb3:
  predecessor blocks: bb0
  [3] Const mutate $7 = Call mutate g$4()
  Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  $8: phi(bb2: $6, bb3: $7)
  Return freeze $8
```

## Code

```javascript
function Or$0() {
  if (f$1()) {
    ("<<TODO: handle complex control flow in codegen>>");
  } else {
    ("<<TODO: handle complex control flow in codegen>>");
  }
  return t8;
}

```
## HIR

```
bb0:
  [1] Const mutate $9 = Call mutate f$2()
  [2] Const mutate $10 = null
  [3] Const mutate $11 = Binary read $9 != read $10
  If (read $11) then:bb2 else:bb3
bb2:
  predecessor blocks: bb0
  [4] Const mutate $12 = read $9
  Goto bb1
bb3:
  predecessor blocks: bb0
  [5] Const mutate $13 = Call mutate g$7()
  Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  $14: phi(bb2: $12, bb3: $13)
  Return freeze $14
```

## Code

```javascript
function QuestionQuestion$0(props$8) {
  if (f$2() != null) {
    ("<<TODO: handle complex control flow in codegen>>");
  } else {
    ("<<TODO: handle complex control flow in codegen>>");
  }
  return t14;
}

```
## HIR

```
bb0:
  Return
```

## Code

```javascript
function f$0() {
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
function g$0() {
  return;
}

```
      