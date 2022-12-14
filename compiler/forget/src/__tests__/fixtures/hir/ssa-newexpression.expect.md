
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
  [1] Return
```

## Reactive Scopes

```
function Foo(
) {
  return
}

```

## Code

```javascript
function Foo$0() {}

```
## HIR

```
bb0:
  [1] Const mutate a$7_@0[1:4] = Array []
  [2] Const mutate b$8_@0:TObject[1:4] = Object {  }
  [3] Const mutate c$9_@0[1:4] = New mutate Foo$5(mutate a$7_@0, mutate b$8_@0:TObject)
  [4] Return freeze c$9_@0
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:4] deps=[] {
    [1] Const mutate a$7_@0[1:4] = Array []
    [2] Const mutate b$8_@0:TObject[1:4] = Object {  }
    [3] Const mutate c$9_@0[1:4] = New mutate Foo$5(mutate a$7_@0, mutate b$8_@0:TObject)
  }
  return freeze c$9_@0
}

```

## Code

```javascript
function Component$0(props$6) {
  const a$7 = [];
  const b$8 = {};
  const c$9 = new Foo$5(a$7, b$8);
  return c$9;
}

```
      