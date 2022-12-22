
## Input

```javascript
// This caused an infinite loop in the compiler
function MyApp(props) {
  const y = makeObj();
  const tmp = y.a;
  const tmp2 = tmp.b;
  y.push(tmp2);
  return y;
}

```

## HIR

```
bb0:
  [1] Const mutate y$7_@0[1:5] = Call mutate makeObj$2:TFunction()
  [2] Const mutate tmp$8_@0[1:5] = read y$7_@0.a
  [3] Const mutate tmp2$9_@0[1:5] = read tmp$8_@0.b
  [4] Call mutate y$7_@0.push(mutate tmp2$9_@0)
  [5] Return freeze y$7_@0
```

## Reactive Scopes

```
function MyApp(
  props,
) {
  scope @0 [1:5] deps=[] out=[y$7_@0] {
    [1] Const mutate y$7_@0[1:5] = Call mutate makeObj$2:TFunction()
    [2] Const mutate tmp$8_@0[1:5] = read y$7_@0.a
    [3] Const mutate tmp2$9_@0[1:5] = read tmp$8_@0.b
    [4] Call mutate y$7_@0.push(mutate tmp2$9_@0)
  }
  return freeze y$7_@0
}

```

## Code

```javascript
function MyApp$0(props$6) {
  const $ = React.useMemoCache();
  let y$7;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    y$7 = makeObj$2();
    const tmp$8 = y$7.a;
    const tmp2$9 = tmp$8.b;
    y$7.push(tmp2$9);
    $[0] = y$7;
  } else {
    y$7 = $[0];
  }

  return y$7;
}

```
      