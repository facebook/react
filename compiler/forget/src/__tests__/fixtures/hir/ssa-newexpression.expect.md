
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
function Foo() {}

```
## HIR

```
bb0:
  [1] Const mutate a$7_@0[1:4] = Array []
  [2] Const mutate b$8_@0:TObject[1:4] = Object {  }
  [3] Const mutate c$9_@0[1:4] = New mutate Foo$4(mutate a$7_@0, mutate b$8_@0:TObject)
  [4] Return freeze c$9_@0
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:4] deps=[] out=[c$9_@0] {
    [1] Const mutate a$7_@0[1:4] = Array []
    [2] Const mutate b$8_@0:TObject[1:4] = Object {  }
    [3] Const mutate c$9_@0[1:4] = New mutate Foo$4(mutate a$7_@0, mutate b$8_@0:TObject)
  }
  return freeze c$9_@0
}

```

## Code

```javascript
function Component(props) {
  const $ = React.useMemoCache();
  let c;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const a = [];
    const b = {};
    c = new Foo(a, b);
    $[0] = c;
  } else {
    c = $[0];
  }

  return c;
}

```
      