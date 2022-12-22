
## Input

```javascript
function foo(a, b, c) {
  const x = [];
  if (a) {
    const y = [];
    y.push(b);
    x.push(<div>{y}</div>);
  } else {
    x.push(c);
  }
  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$11_@0[1:11] = Array []
  [2] If (read a$8) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate y$12_@1[3:5] = Array []
  [4] Call mutate y$12_@1.push(read b$9)
  [5] Const mutate $13:TPrimitive = "div"
  [6] Const mutate t7$14_@2 = JSX <read $13:TPrimitive>{freeze y$12_@1}</read $13:TPrimitive>
  [7] Call mutate x$11_@0.push(read t7$14_@2)
  [8] Goto bb1
bb3:
  predecessor blocks: bb0
  [9] Call mutate x$11_@0.push(read c$10)
  [10] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [11] Return freeze x$11_@0
```

## Reactive Scopes

```
function foo(
  a,
  b,
  c,
) {
  scope @0 [1:11] deps=[read a$8, read b$9, read c$10] out=[x$11_@0] {
    [1] Const mutate x$11_@0[1:11] = Array []
    if (read a$8) {
      scope @1 [3:5] deps=[read b$9] out=[y$12_@1] {
        [3] Const mutate y$12_@1[3:5] = Array []
        [4] Call mutate y$12_@1.push(read b$9)
      }
      [5] Const mutate $13:TPrimitive = "div"
      scope @2 [6:7] deps=[freeze y$12_@1] out=[$14_@2] {
        [6] Const mutate $14_@2 = JSX <read $13:TPrimitive>{freeze y$12_@1}</read $13:TPrimitive>
      }
      [7] Call mutate x$11_@0.push(read $14_@2)
    } else {
      [9] Call mutate x$11_@0.push(read c$10)
    }
  }
  return freeze x$11_@0
}

```

## Code

```javascript
function foo(a, b, c) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a;
  const c_1 = $[1] !== b;
  const c_2 = $[2] !== c;
  let x;
  if (c_0 || c_1 || c_2) {
    x = [];

    if (a) {
      const c_4 = $[4] !== b;
      let y;

      if (c_4) {
        y = [];
        y.push(b);
        $[4] = b;
        $[5] = y;
      } else {
        y = $[5];
      }

      const c_6 = $[6] !== y;
      let t7;

      if (c_6) {
        t7 = <div>{y}</div>;
        $[6] = y;
        $[7] = t7;
      } else {
        t7 = $[7];
      }

      x.push(t7);
    } else {
      x.push(c);
    }

    $[0] = a;
    $[1] = b;
    $[2] = c;
    $[3] = x;
  } else {
    x = $[3];
  }

  return x;
}

```
      