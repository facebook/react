
## Input

```javascript
// function Component$forget(props) {
//   scope_a: {
//     const a = [];
//     if (b) {
//       a.push(props.p0);
//     }
//   }
//   scope_b: {
//     const b = [];
//     if (props.p1) {
//       b.push(props.p2);
//     }
//   }
//   scope_return: {
//     return <Foo a={a} b={b} />;
//   }
// }
function Component(props) {
  const a = [];
  const b = [];
  if (b) {
    a.push(props.p0);
  }
  if (props.p1) {
    b.push(props.p2);
  }
  return <Foo a={a} b={b} />;
}

// function Component$forget(props) {
//   scope_a_b: {
//     const a = [];
//     const b = [];
//     if (mayMutate(b)) {
//       a.push(props.p0);
//     }
//     if (props.p1) {
//       b.push(props.p2);
//     }
//   }
//   scope_return: {
//     return <Foo a={a} b={b} />;
//   }
// }
function Component(props) {
  const a = [];
  const b = [];
  if (mayMutate(b)) {
    a.push(props.p0);
  }
  if (props.p1) {
    b.push(props.p2);
  }
  return <Foo a={a} b={b} />;
}

function Foo() {}
function mayMutate() {}

```

## HIR

```
bb0:
  Const mutate a$7 = Array []
  Const mutate b$8 = Array []
  If (read b$8) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  Call mutate a$7.push(read props$6.p0)
  Goto bb1
bb1:
  predecessor blocks: bb0 bb2
  props$9: phi(bb0: props$6, bb2: props$6)
  b$10: phi(bb0: b$8, bb2: b$8)
  Foo$12: phi(bb0: Foo$4, bb2: Foo$4)
  a$14: phi(bb0: a$7, bb2: a$7)
  If (read props$9.p1) then:bb4 else:bb3
bb4:
  predecessor blocks: bb1
  Call mutate b$10.push(read props$9.p2)
  Goto bb3
bb3:
  predecessor blocks: bb1 bb4
  Foo$11: phi(bb1: Foo$12, bb4: Foo$12)
  a$13: phi(bb1: a$14, bb4: a$14)
  b$15: phi(bb1: b$10, bb4: b$10)
  Const mutate $16 = JSX <read Foo$11 a={freeze a$13} b={freeze b$15} ></read Foo$11>
  Return read $16
```

## Code

```javascript
function Component$0(props$6) {
  const a$7 = [];
  const b$8 = [];
  if (b$8) {
    a$7.push(props$6.p0);
    ("<<TODO: handle complex control flow in codegen>>");
  }

  if (props$9.p1) {
    b$10.push(props$9.p2);
    ("<<TODO: handle complex control flow in codegen>>");
  }

  return <Foo$11 a={a$13} b={b$15}></Foo$11>;
}

```
## HIR

```
bb0:
  Const mutate a$9 = Array []
  Const mutate b$10 = Array []
  Const mutate $11 = Call mutate mayMutate$4(mutate b$10)
  If (read $11) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  Call mutate a$9.push(read props$8.p0)
  Goto bb1
bb1:
  predecessor blocks: bb0 bb2
  props$12: phi(bb0: props$8, bb2: props$8)
  b$13: phi(bb0: b$10, bb2: b$10)
  Foo$15: phi(bb0: Foo$6, bb2: Foo$6)
  a$17: phi(bb0: a$9, bb2: a$9)
  If (read props$12.p1) then:bb4 else:bb3
bb4:
  predecessor blocks: bb1
  Call mutate b$13.push(read props$12.p2)
  Goto bb3
bb3:
  predecessor blocks: bb1 bb4
  Foo$14: phi(bb1: Foo$15, bb4: Foo$15)
  a$16: phi(bb1: a$17, bb4: a$17)
  b$18: phi(bb1: b$13, bb4: b$13)
  Const mutate $19 = JSX <read Foo$14 a={freeze a$16} b={freeze b$18} ></read Foo$14>
  Return read $19
```

## Code

```javascript
function Component$0(props$8) {
  const a$9 = [];
  const b$10 = [];
  if (mayMutate$4(b$10)) {
    a$9.push(props$8.p0);
    ("<<TODO: handle complex control flow in codegen>>");
  }

  if (props$12.p1) {
    b$13.push(props$12.p2);
    ("<<TODO: handle complex control flow in codegen>>");
  }

  return <Foo$14 a={a$16} b={b$18}></Foo$14>;
}

```
## HIR

```
bb0:
  Return
```

## Code

```javascript
function Foo$0() {
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
function mayMutate$0() {
  return;
}

```
      