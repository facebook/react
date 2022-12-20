
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
  [5] Let mutate x$18_@0[5:10] = undefined
  [5] If (read $15:TPrimitive) then:bb4 else:bb5 fallthrough=bb3
bb4:
  predecessor blocks: bb2
  [6] Const mutate x$16 = read a$9
  [7] Reassign mutate x$18_@0[5:10] = read x$16
  [7] Goto bb3
bb5:
  predecessor blocks: bb2
  [8] Const mutate x$17 = read b$10
  [9] Reassign mutate x$18_@0[5:10] = read x$17
  [9] Goto bb3
bb3:
  predecessor blocks: bb4 bb5
  [10] read x$18_@0
  [11] Goto bb1
bb6:
  predecessor blocks: bb0
  [12] Const mutate $19:TPrimitive = true
  [13] Let mutate x$22_@1[13:18] = undefined
  [13] If (read $19:TPrimitive) then:bb8 else:bb9 fallthrough=bb7
bb8:
  predecessor blocks: bb6
  [14] Const mutate x$20 = read c$11
  [15] Reassign mutate x$22_@1[13:18] = read x$20
  [15] Goto bb7
bb9:
  predecessor blocks: bb6
  [16] Const mutate x$21 = read d$12
  [17] Reassign mutate x$22_@1[13:18] = read x$21
  [17] Goto bb7
bb7:
  predecessor blocks: bb8 bb9
  [18] read x$22_@1
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
    scope @0 [5:10] deps=[read a$9, read b$10] out=[x$18_@0] {
      [5] Let mutate x$18_@0[5:10] = undefined
      if (read $15:TPrimitive) {
        [6] Const mutate x$16 = read a$9
        [7] Reassign mutate x$18_@0[5:10] = read x$16
      } else {
        [8] Const mutate x$17 = read b$10
        [9] Reassign mutate x$18_@0[5:10] = read x$17
      }
    }
    [10] read x$18_@0
  } else {
    [12] Const mutate $19:TPrimitive = true
    scope @1 [13:18] deps=[read c$11, read d$12] out=[x$22_@1] {
      [13] Let mutate x$22_@1[13:18] = undefined
      if (read $19:TPrimitive) {
        [14] Const mutate x$20 = read c$11
        [15] Reassign mutate x$22_@1[13:18] = read x$20
      } else {
        [16] Const mutate x$21 = read d$12
        [17] Reassign mutate x$22_@1[13:18] = read x$21
      }
    }
    [18] read x$22_@1
  }
  return
}

```

## Code

```javascript
function foo$0(a$9, b$10, c$11, d$12) {
  const $ = React.useMemoCache();
  const x$13 = 0;
  if (true) {
    const c_0 = $[0] !== a$9;
    const c_1 = $[1] !== b$10;
    let x$18;

    if (c_0 || c_1) {
      x$18 = undefined;

      if (true) {
        const x$16 = a$9;
        x$18 = x$16;
      } else {
        const x$17 = b$10;
        x$18 = x$17;
      }

      $[0] = a$9;
      $[1] = b$10;
      $[2] = x$18;
    } else {
      x$18 = $[2];
    }

    x$18;
  } else {
    const c_3 = $[3] !== c$11;
    const c_4 = $[4] !== d$12;
    let x$22;

    if (c_3 || c_4) {
      x$22 = undefined;

      if (true) {
        const x$20 = c$11;
        x$22 = x$20;
      } else {
        const x$21 = d$12;
        x$22 = x$21;
      }

      $[3] = c$11;
      $[4] = d$12;
      $[5] = x$22;
    } else {
      x$22 = $[5];
    }

    x$22;
  }
}

```
      