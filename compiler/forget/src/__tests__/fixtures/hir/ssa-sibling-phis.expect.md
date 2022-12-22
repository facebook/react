
## Input

```javascript
function foo(a, b, c, d) {
  let x = 0;
  if (true) {
    if (true) {
      x = a;
    } else {
      x = b;
    }
    x;
  } else {
    if (true) {
      x = c;
    } else {
      x = d;
    }
    x;
  }
  // note: intentionally no phi here so that there are two distinct phis above
}

```

## HIR

```
bb0:
  [1] Const mutate x$13:TPrimitive = 0
  [2] Const mutate $14:TPrimitive = true
  [3] If (read $14:TPrimitive) then:bb2 else:bb6 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [4] Const mutate $15:TPrimitive = true
  [5] Let mutate x$0$18_@0[5:10] = undefined
  [5] If (read $15:TPrimitive) then:bb4 else:bb5 fallthrough=bb3
bb4:
  predecessor blocks: bb2
  [6] Const mutate x$1$16 = read a$9
  [7] Reassign mutate x$0$18_@0[5:10] = read x$1$16
  [7] Goto bb3
bb5:
  predecessor blocks: bb2
  [8] Const mutate x$2$17 = read b$10
  [9] Reassign mutate x$0$18_@0[5:10] = read x$2$17
  [9] Goto bb3
bb3:
  predecessor blocks: bb4 bb5
  [10] read x$0$18_@0
  [11] Goto bb1
bb6:
  predecessor blocks: bb0
  [12] Const mutate $19:TPrimitive = true
  [13] Let mutate x$3$22_@1[13:18] = undefined
  [13] If (read $19:TPrimitive) then:bb8 else:bb9 fallthrough=bb7
bb8:
  predecessor blocks: bb6
  [14] Const mutate x$4$20 = read c$11
  [15] Reassign mutate x$3$22_@1[13:18] = read x$4$20
  [15] Goto bb7
bb9:
  predecessor blocks: bb6
  [16] Const mutate x$5$21 = read d$12
  [17] Reassign mutate x$3$22_@1[13:18] = read x$5$21
  [17] Goto bb7
bb7:
  predecessor blocks: bb8 bb9
  [18] read x$3$22_@1
  [19] Goto bb1
bb1:
  predecessor blocks: bb3 bb7
  [20] Return
```

## Reactive Scopes

```
function foo(
  a,
  b,
  c,
  d,
) {
  [1] Const mutate x$13:TPrimitive = 0
  [2] Const mutate $14:TPrimitive = true
  if (read $14:TPrimitive) {
    [4] Const mutate $15:TPrimitive = true
    scope @0 [5:10] deps=[read a$9, read b$10] out=[x$0$18_@0] {
      [5] Let mutate x$0$18_@0[5:10] = undefined
      if (read $15:TPrimitive) {
        [6] Const mutate x$1$16 = read a$9
        [7] Reassign mutate x$0$18_@0[5:10] = read x$1$16
      } else {
        [8] Const mutate x$2$17 = read b$10
        [9] Reassign mutate x$0$18_@0[5:10] = read x$2$17
      }
    }
    [10] read x$0$18_@0
  } else {
    [12] Const mutate $19:TPrimitive = true
    scope @1 [13:18] deps=[read c$11, read d$12] out=[x$3$22_@1] {
      [13] Let mutate x$3$22_@1[13:18] = undefined
      if (read $19:TPrimitive) {
        [14] Const mutate x$4$20 = read c$11
        [15] Reassign mutate x$3$22_@1[13:18] = read x$4$20
      } else {
        [16] Const mutate x$5$21 = read d$12
        [17] Reassign mutate x$3$22_@1[13:18] = read x$5$21
      }
    }
    [18] read x$3$22_@1
  }
  return
}

```

## Code

```javascript
function foo(a, b, c, d) {
  const $ = React.useMemoCache();
  const x = 0;
  if (true) {
    const c_0 = $[0] !== a;
    const c_1 = $[1] !== b;
    let x$0;

    if (c_0 || c_1) {
      x$0 = undefined;

      if (true) {
        const x$1 = a;
        x$0 = x$1;
      } else {
        const x$2 = b;
        x$0 = x$2;
      }

      $[0] = a;
      $[1] = b;
      $[2] = x$0;
    } else {
      x$0 = $[2];
    }

    x$0;
  } else {
    const c_3 = $[3] !== c;
    const c_4 = $[4] !== d;
    let x$3;

    if (c_3 || c_4) {
      x$3 = undefined;

      if (true) {
        const x$4 = c;
        x$3 = x$4;
      } else {
        const x$5 = d;
        x$3 = x$5;
      }

      $[3] = c;
      $[4] = d;
      $[5] = x$3;
    } else {
      x$3 = $[5];
    }

    x$3;
  }
}

```
      