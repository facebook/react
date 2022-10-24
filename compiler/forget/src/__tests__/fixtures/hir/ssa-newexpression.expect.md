
## Input

```javascript
function Foo() {}

function Component(props) {
  const a = [];
  const b = {};
  let c = new Foo(a, b);
  return c;
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
  Const mutate Foo$8: phi()
  Const mutate a$6 = Array []
  Const mutate b$7 = Object {  }
  Let mutate c$9 = New mutate Foo$8(mutate a$6, mutate b$7)
  Return mutate c$9
```

## Code

```javascript
function Component$0(props$1) {
  const a$6 = [];
  const b$7 = {};
  let c$9 = new Foo$8(a$6, b$7);
  return c$9;
}

```
      