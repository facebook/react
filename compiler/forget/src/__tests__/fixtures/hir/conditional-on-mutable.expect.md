
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
  [1] Const mutate a$7[1:3] = Array []
  [2] Const mutate b$8[2:4] = Array []
  If (read b$8) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  [3] Call mutate a$7.push(read props$6.p0)
  Goto bb1
bb1:
  predecessor blocks: bb0 bb2
  If (read props$6.p1) then:bb4 else:bb3
bb4:
  predecessor blocks: bb1
  [4] Call mutate b$8.push(read props$6.p2)
  Goto bb3
bb3:
  predecessor blocks: bb1 bb4
  [5] Const mutate $16 = JSX <read Foo$4 a={freeze a$7} b={freeze b$8} ></read Foo$4>
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

  if (props$6.p1) {
    b$8.push(props$6.p2);
    ("<<TODO: handle complex control flow in codegen>>");
  }

  return <Foo$4 a={a$7} b={b$8}></Foo$4>;
}

```
## HIR

```
bb0:
  [1] Const mutate a$9[1:4] = Array []
  [2] Const mutate b$10[2:5] = Array []
  [3] Const mutate $11 = Call mutate mayMutate$4(mutate b$10)
  If (read $11) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  [4] Call mutate a$9.push(read props$8.p0)
  Goto bb1
bb1:
  predecessor blocks: bb0 bb2
  If (read props$8.p1) then:bb4 else:bb3
bb4:
  predecessor blocks: bb1
  [5] Call mutate b$10.push(read props$8.p2)
  Goto bb3
bb3:
  predecessor blocks: bb1 bb4
  [6] Const mutate $19 = JSX <read Foo$6 a={freeze a$9} b={freeze b$10} ></read Foo$6>
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

  if (props$8.p1) {
    b$10.push(props$8.p2);
    ("<<TODO: handle complex control flow in codegen>>");
  }

  return <Foo$6 a={a$9} b={b$10}></Foo$6>;
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
      