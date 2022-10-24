
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
  Const mutate foo$11: phi()
  Const mutate a$9 = Array []
  Const mutate b$10 = Object {  }
  Call mutate foo$11(mutate a$9, mutate b$10)
  Const mutate $12 = "div"
  Let mutate _$13 = JSX <mutate $12 a={mutate a$9} ></mutate $12>
  Call mutate foo$11(mutate b$10)
  Const mutate $14 = "div"
  Const mutate $15 = JSX <mutate $14 a={mutate a$9} b={mutate b$10} ></mutate $14>
  Return mutate $15
```

## Code

```javascript
function Component$0(props$1) {
  const a$9 = [];
  const b$10 = {};
  foo$11(a$9, b$10);
  let _$13 = <div a={a$9}></div>;

  foo$11(b$10);
  return <div a={a$9} b={b$10}></div>;
}

```
      