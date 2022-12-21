
## Input

```javascript
function useFreeze() {}
function foo() {}

function Component(props) {
  const x = [];
  const y = useFreeze(x);
  foo(y, x);
  return (
    <Component>
      {x}
      {y}
    </Component>
  );
}

```

## HIR

```
bb0:
  [1] Return
```

## Reactive Scopes

```
function useFreeze(
) {
  return
}

```

## Code

```javascript
function useFreeze$0() {}

```
## HIR

```
bb0:
  [1] Return
```

## Reactive Scopes

```
function foo(
) {
  return
}

```

## Code

```javascript
function foo$0() {}

```
## HIR

```
bb0:
  [1] Const mutate x$11_@0 = Array []
  [2] Const mutate y$12_@1 = Call read useFreeze$3:TFunction(freeze x$11_@0)
  [3] Call mutate foo$5:TFunction(read y$12_@1, read x$11_@0)
  [4] Const mutate $13:TPrimitive = "\n      "
  [5] Const mutate $14:TPrimitive = "\n      "
  [6] Const mutate $15:TPrimitive = "\n    "
  [7] Const mutate t5$16_@2 = JSX <read Component$0>{read $13:TPrimitive}{read x$11_@0}{read $14:TPrimitive}{read y$12_@1}{read $15:TPrimitive}</read Component$0>
  [8] Return read t5$16_@2
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:2] deps=[] out=[x$11_@0] {
    [1] Const mutate x$11_@0 = Array []
  }
  scope @1 [2:3] deps=[freeze x$11_@0] out=[y$12_@1] {
    [2] Const mutate y$12_@1 = Call read useFreeze$3:TFunction(freeze x$11_@0)
  }
  [3] Call mutate foo$5:TFunction(read y$12_@1, read x$11_@0)
  [4] Const mutate $13:TPrimitive = "\n      "
  [5] Const mutate $14:TPrimitive = "\n      "
  [6] Const mutate $15:TPrimitive = "\n    "
  scope @2 [7:8] deps=[read x$11_@0, read y$12_@1] out=[$16_@2] {
    [7] Const mutate $16_@2 = JSX <read Component$0>{read $13:TPrimitive}{read x$11_@0}{read $14:TPrimitive}{read y$12_@1}{read $15:TPrimitive}</read Component$0>
  }
  return read $16_@2
}

```

## Code

```javascript
function Component$0(props$10) {
  const $ = React.useMemoCache();
  let x$11;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x$11 = [];
    $[0] = x$11;
  } else {
    x$11 = $[0];
  }

  const c_1 = $[1] !== x$11;
  let y$12;

  if (c_1) {
    y$12 = useFreeze$3(x$11);
    $[1] = x$11;
    $[2] = y$12;
  } else {
    y$12 = $[2];
  }

  foo$5(y$12, x$11);
  const c_3 = $[3] !== x$11;
  const c_4 = $[4] !== y$12;
  let t5$16;

  if (c_3 || c_4) {
    t5$16 = (
      <Component$0>
        {x$11}
        {y$12}
      </Component$0>
    );
    $[3] = x$11;
    $[4] = y$12;
    $[5] = t5$16;
  } else {
    t5$16 = $[5];
  }

  return t5$16;
}

```
      