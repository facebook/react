
## Input

```javascript
function And() {
  return f() && g();
}

function Or() {
  return f() || g();
}

function QuestionQuestion(props) {
  return f() ?? g();
}

function f() {}
function g() {}

```

## HIR

```
bb0:
  [1] Const mutate t0$5_@0 = Call mutate f$1:TFunction()
  [2] Let mutate t2$8_@1[2:7] = undefined
  [2] If (read t0$5_@0) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate t3$6_@2 = Call mutate g$4:TFunction()
  [4] Reassign mutate t2$8_@1[2:7] = read t3$6_@2
  [4] Goto bb1
bb3:
  predecessor blocks: bb0
  [5] Const mutate $7 = read t0$5_@0
  [6] Reassign mutate t2$8_@1[2:7] = read $7
  [6] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [7] Return freeze t2$8_@1
```

## Reactive Scopes

```
function And(
) {
  scope @0 [1:2] deps=[] out=[$5_@0] {
    [1] Const mutate $5_@0 = Call mutate f$1:TFunction()
  }
  scope @1 [2:7] deps=[read $5_@0] out=[$8_@1] {
    [2] Let mutate $8_@1[2:7] = undefined
    if (read $5_@0) {
      scope @2 [3:4] deps=[] out=[$6_@2] {
        [3] Const mutate $6_@2 = Call mutate g$4:TFunction()
      }
      [4] Reassign mutate $8_@1[2:7] = read $6_@2
    } else {
      [5] Const mutate $7 = read $5_@0
      [6] Reassign mutate $8_@1[2:7] = read $7
    }
  }
  return freeze $8_@1
}

```

## Code

```javascript
function And$0() {
  const $ = React.useMemoCache();
  let t0$5;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0$5 = f$1();
    $[0] = t0$5;
  } else {
    t0$5 = $[0];
  }

  const c_1 = $[1] !== t0$5;
  let t2$8;

  if (c_1) {
    t2$8 = undefined;

    if (t0$5) {
      let t3$6;

      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t3$6 = g$4();
        $[3] = t3$6;
      } else {
        t3$6 = $[3];
      }

      t2$8 = t3$6;
    } else {
      t2$8 = t0$5;
    }

    $[1] = t0$5;
    $[2] = t2$8;
  } else {
    t2$8 = $[2];
  }

  return t2$8;
}

```
## HIR

```
bb0:
  [1] Const mutate t0$5_@0 = Call mutate f$1:TFunction()
  [2] Let mutate t2$8_@1[2:7] = undefined
  [2] If (read t0$5_@0) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate $6 = read t0$5_@0
  [4] Reassign mutate t2$8_@1[2:7] = read $6
  [4] Goto bb1
bb3:
  predecessor blocks: bb0
  [5] Const mutate t3$7_@2 = Call mutate g$4:TFunction()
  [6] Reassign mutate t2$8_@1[2:7] = read t3$7_@2
  [6] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [7] Return freeze t2$8_@1
```

## Reactive Scopes

```
function Or(
) {
  scope @0 [1:2] deps=[] out=[$5_@0] {
    [1] Const mutate $5_@0 = Call mutate f$1:TFunction()
  }
  scope @1 [2:7] deps=[read $5_@0] out=[$8_@1] {
    [2] Let mutate $8_@1[2:7] = undefined
    if (read $5_@0) {
      [3] Const mutate $6 = read $5_@0
      [4] Reassign mutate $8_@1[2:7] = read $6
    } else {
      scope @2 [5:6] deps=[] out=[$7_@2] {
        [5] Const mutate $7_@2 = Call mutate g$4:TFunction()
      }
      [6] Reassign mutate $8_@1[2:7] = read $7_@2
    }
  }
  return freeze $8_@1
}

```

## Code

```javascript
function Or$0() {
  const $ = React.useMemoCache();
  let t0$5;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0$5 = f$1();
    $[0] = t0$5;
  } else {
    t0$5 = $[0];
  }

  const c_1 = $[1] !== t0$5;
  let t2$8;

  if (c_1) {
    t2$8 = undefined;

    if (t0$5) {
      t2$8 = t0$5;
    } else {
      let t3$7;

      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t3$7 = g$4();
        $[3] = t3$7;
      } else {
        t3$7 = $[3];
      }

      t2$8 = t3$7;
    }

    $[1] = t0$5;
    $[2] = t2$8;
  } else {
    t2$8 = $[2];
  }

  return t2$8;
}

```
## HIR

```
bb0:
  [1] Const mutate t0$9_@0:TPrimitive = Call mutate f$2:TFunction()
  [2] Const mutate $10:TPrimitive = null
  [3] Const mutate $11:TPrimitive = Binary read t0$9_@0:TPrimitive != read $10:TPrimitive
  [4] Let mutate t2$14_@1[4:9] = undefined
  [4] If (read $11:TPrimitive) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [5] Const mutate $12:TPrimitive = read t0$9_@0:TPrimitive
  [6] Reassign mutate t2$14_@1[4:9] = read $12:TPrimitive
  [6] Goto bb1
bb3:
  predecessor blocks: bb0
  [7] Const mutate t3$13_@2 = Call mutate g$7:TFunction()
  [8] Reassign mutate t2$14_@1[4:9] = read t3$13_@2
  [8] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [9] Return freeze t2$14_@1
```

## Reactive Scopes

```
function QuestionQuestion(
  props,
) {
  scope @0 [1:2] deps=[] out=[$9_@0] {
    [1] Const mutate $9_@0:TPrimitive = Call mutate f$2:TFunction()
  }
  [2] Const mutate $10:TPrimitive = null
  [3] Const mutate $11:TPrimitive = Binary read $9_@0:TPrimitive != read $10:TPrimitive
  scope @1 [4:9] deps=[read $9_@0:TPrimitive] out=[$14_@1] {
    [4] Let mutate $14_@1[4:9] = undefined
    if (read $11:TPrimitive) {
      [5] Const mutate $12:TPrimitive = read $9_@0:TPrimitive
      [6] Reassign mutate $14_@1[4:9] = read $12:TPrimitive
    } else {
      scope @2 [7:8] deps=[] out=[$13_@2] {
        [7] Const mutate $13_@2 = Call mutate g$7:TFunction()
      }
      [8] Reassign mutate $14_@1[4:9] = read $13_@2
    }
  }
  return freeze $14_@1
}

```

## Code

```javascript
function QuestionQuestion$0(props$8) {
  const $ = React.useMemoCache();
  let t0$9;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0$9 = f$2();
    $[0] = t0$9;
  } else {
    t0$9 = $[0];
  }

  const c_1 = $[1] !== t0$9;
  let t2$14;

  if (c_1) {
    t2$14 = undefined;

    if (t0$9 != null) {
      t2$14 = t0$9;
    } else {
      let t3$13;

      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        t3$13 = g$7();
        $[3] = t3$13;
      } else {
        t3$13 = $[3];
      }

      t2$14 = t3$13;
    }

    $[1] = t0$9;
    $[2] = t2$14;
  } else {
    t2$14 = $[2];
  }

  return t2$14;
}

```
## HIR

```
bb0:
  [1] Return
```

## Reactive Scopes

```
function f(
) {
  return
}

```

## Code

```javascript
function f$0() {}

```
## HIR

```
bb0:
  [1] Return
```

## Reactive Scopes

```
function g(
) {
  return
}

```

## Code

```javascript
function g$0() {}

```
      