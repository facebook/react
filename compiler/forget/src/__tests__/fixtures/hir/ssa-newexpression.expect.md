
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
  Const mutate a$7 = Array []
  Const mutate b$8 = Object {  }
  Let mutate c$9 = New mutate Foo$5(mutate a$7, mutate b$8)
  Return freeze c$9
```

## Code

```javascript
function Component$0(props$6) {
  const a$7 = [];
  const b$8 = {};
  let c$9 = new Foo$5(a$7, b$8);
  return c$9;
}

```
      