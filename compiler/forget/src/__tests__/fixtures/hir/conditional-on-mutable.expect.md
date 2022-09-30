
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
  mutable a$2 = Array []
  mutable b$3 = Array []
  If (mutable b$3) then:bb2 else:bb1
bb2:
  Call mutable a$2.push(frozen props$1.p0)
  Goto bb1
bb1:
  If (frozen props$1.p1) then:bb4 else:bb3
bb4:
  Call mutable b$3.push(frozen props$1.p2)
  Goto bb3
bb3:
  frozen $5 = JSX <frozen Foo$4 a={readonly a$2} b={readonly b$3} ></frozen Foo$4>
  Return frozen $5
```

## Code

```javascript
function Component$0(props$1) {
  a$2 = [];
  b$3 = [];
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
  mutable a$2 = Array []
  mutable b$3 = Array []
  mutable $5 = Call mutable mayMutate$4(mutable b$3)
  If (mutable $5) then:bb2 else:bb1
bb2:
  Call mutable a$2.push(frozen props$1.p0)
  Goto bb1
bb1:
  If (frozen props$1.p1) then:bb4 else:bb3
bb4:
  Call mutable b$3.push(frozen props$1.p2)
  Goto bb3
bb3:
  frozen $7 = JSX <frozen Foo$6 a={readonly a$2} b={readonly b$3} ></frozen Foo$6>
  Return frozen $7
```

## Code

```javascript
function Component$0(props$1) {
  a$2 = [];
  b$3 = [];
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
      