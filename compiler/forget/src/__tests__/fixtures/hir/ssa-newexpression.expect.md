
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
  Const mutate a$6 = Array []
  Const mutate b$7 = Object {  }
  Let mutate c$8 = New mutate Foo$5(mutate a$6, mutate b$7)
  Return freeze c$8
```

## Code

```javascript
function Component$0(props$1) {
  const a$6 = [];
  const b$7 = {};
  let c$8 = new Foo$5(a$6, b$7);
  return c$8;
}

```
      