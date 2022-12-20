
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
function foo$0(a$8, b$9, c$10) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== a$8;
  const c_1 = $[1] !== b$9;
  const c_2 = $[2] !== c$10;
  let x$11;
  if (c_0 || c_1 || c_2) {
    x$11 = [];

    if (a$8) {
      const c_4 = $[4] !== b$9;
      let y$12;

      if (c_4) {
        y$12 = [];
        y$12.push(b$9);
        $[4] = b$9;
        $[5] = y$12;
      } else {
        y$12 = $[5];
      }

      const c_6 = $[6] !== y$12;
      let t7$14;

      if (c_6) {
        t7$14 = <div>{y$12}</div>;
        $[6] = y$12;
        $[7] = t7$14;
      } else {
        t7$14 = $[7];
      }

      x$11.push(t7$14);
    } else {
      x$11.push(c$10);
    }

    $[0] = a$8;
    $[1] = b$9;
    $[2] = c$10;
    $[3] = x$11;
  } else {
    x$11 = $[3];
  }

  return x$11;
}

```
      