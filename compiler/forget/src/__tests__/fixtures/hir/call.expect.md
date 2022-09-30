
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
  mutable a$2 = Array []
  mutable b$3 = Object {  }
  Call mutable foo$4(mutable a$2, mutable b$3)
  frozen $6 = "div"
  mutable _$5 = JSX <frozen $6 a={mutable a$2} ></frozen $6>
  Call mutable foo$4(mutable b$3)
  frozen $7 = "div"
  frozen $8 = JSX <frozen $7 a={readonly a$2} b={readonly b$3} ></frozen $7>
  Return frozen $8
```

## Code

```javascript
function Component$0(props$1) {
  a$2 = [];
  b$3 = {};
  foo$4(a$2, b$3);
  _$5 = <div a={a$2}></div>;
  foo$4(b$3);
  return <div a={a$2} b={b$3}></div>;
}

```
      