
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
  Const mutate a$2 = Array []
  Const mutate b$3 = Array []
  If (read b$3) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  Call mutate a$2.push(read props$1.p0)
  Goto bb1
bb1:
  predecessor blocks: bb0 bb2
  If (read props$1.p1) then:bb4 else:bb3
bb4:
  predecessor blocks: bb1
  Call mutate b$3.push(read props$1.p2)
  Goto bb3
bb3:
  predecessor blocks: bb1 bb4
  Const mutate $5 = JSX <read Foo$4 a={freeze a$2} b={freeze b$3} ></read Foo$4>
  Return read $5
```

## Code

```javascript
function Component$0(props$1) {
  const a$2 = [];
  const b$3 = [];
  if (b$3) {
    a$2.push(props$1.p0);
    ("<<TODO: handle complex control flow in codegen>>");
  }

  if (props$1.p1) {
    b$3.push(props$1.p2);
    ("<<TODO: handle complex control flow in codegen>>");
  }

  return <Foo$4 a={a$2} b={b$3}></Foo$4>;
}

```
## HIR

```
bb0:
  Const mutate a$2 = Array []
  Const mutate b$3 = Array []
  Const mutate $5 = Call mutate mayMutate$4(mutate b$3)
  If (read $5) then:bb2 else:bb1
bb2:
  predecessor blocks: bb0
  Call mutate a$2.push(read props$1.p0)
  Goto bb1
bb1:
  predecessor blocks: bb0 bb2
  If (read props$1.p1) then:bb4 else:bb3
bb4:
  predecessor blocks: bb1
  Call mutate b$3.push(read props$1.p2)
  Goto bb3
bb3:
  predecessor blocks: bb1 bb4
  Const mutate $7 = JSX <read Foo$6 a={freeze a$2} b={freeze b$3} ></read Foo$6>
  Return read $7
```

## Code

```javascript
function Component$0(props$1) {
  const a$2 = [];
  const b$3 = [];
  if (mayMutate$4(b$3)) {
    a$2.push(props$1.p0);
    ("<<TODO: handle complex control flow in codegen>>");
  }

  if (props$1.p1) {
    b$3.push(props$1.p2);
    ("<<TODO: handle complex control flow in codegen>>");
  }

  return <Foo$6 a={a$2} b={b$3}></Foo$6>;
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
      