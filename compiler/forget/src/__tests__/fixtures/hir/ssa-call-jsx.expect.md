
## Input

```javascript
function foo() {}

function Component(props) {
  const a = [];
  const b = {};
  foo(a, b);
  let _ = <div a={a} />;
  foo(b);
  return <div a={a} b={b} />;
}

```

## HIR

```
bb0:
  Return
```

## Code

```javascript
function foo$0() {
  return;
}

```
## HIR

```
bb0:
  Const mutate a$9 = Array []
  Const mutate b$10 = Object {  }
  Call mutate foo$4(mutate a$9, mutate b$10)
  Const mutate $11 = "div"
  Let mutate _$12 = JSX <read $11 a={freeze a$9} ></read $11>
  Call mutate foo$4(mutate b$10)
  Const mutate $13 = "div"
  Const mutate $14 = JSX <read $13 a={read a$9} b={freeze b$10} ></read $13>
  Return read $14
```

## Code

```javascript
function Component$0(props$1) {
  const a$9 = [];
  const b$10 = {};
  foo$4(a$9, b$10);
  let _$12 = <div a={a$9}></div>;

  foo$4(b$10);
  return <div a={a$9} b={b$10}></div>;
}

```
      