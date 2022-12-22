
## Input

```javascript
function foo(a, b, c) {
  let x = [];
  if (a) {
    let y = [];
    if (b) {
      y.push(c);
    }

    x.push(<div>{y}</div>);
  }
  return x;
}

```

## HIR

```
bb0:
  [1] Const mutate x$11_@0[1:11] = Array []
  [2] If (read a$8) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate y$12_@1[3:7] = Array []
  [4] If (read b$9) then:bb4 else:bb3 fallthrough=bb3
bb4:
  predecessor blocks: bb2
  [5] Call mutate y$12_@1.push(read c$10)
  [6] Goto bb3
bb3:
  predecessor blocks: bb4 bb2
  [7] Const mutate $13:TPrimitive = "div"
  [8] Const mutate t8$15_@2 = JSX <read $13:TPrimitive>{freeze y$12_@1}</read $13:TPrimitive>
  [9] Call mutate x$11_@0.push(read t8$15_@2)
  [10] Goto bb1
bb1:
  predecessor blocks: bb3 bb0
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
      scope @1 [3:7] deps=[read b$9, read c$10] out=[y$12_@1] {
        [3] Const mutate y$12_@1[3:7] = Array []
        if (read b$9) {
          [5] Call mutate y$12_@1.push(read c$10)
        }
      }
      [7] Const mutate $13:TPrimitive = "div"
      scope @2 [8:9] deps=[freeze y$12_@1] out=[$15_@2] {
        [8] Const mutate $15_@2 = JSX <read $13:TPrimitive>{freeze y$12_@1}</read $13:TPrimitive>
      }
      [9] Call mutate x$11_@0.push(read $15_@2)
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
      const c_5 = $[5] !== c;
      let y;

      if (c_4 || c_5) {
        y = [];

        if (b) {
          y.push(c);
        }

        $[4] = b;
        $[5] = c;
        $[6] = y;
      } else {
        y = $[6];
      }

      const c_7 = $[7] !== y;
      let t8;

      if (c_7) {
        t8 = <div>{y}</div>;
        $[7] = y;
        $[8] = t8;
      } else {
        t8 = $[8];
      }

      x.push(t8);
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
      