
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
  [2] Let mutate t2$6_@1[2:7] = undefined
  [2] If (read t0$5_@0) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate t2$6_@1[2:7] = Call mutate g$4:TFunction()
  [4] Goto bb1
bb3:
  predecessor blocks: bb0
  [5] Const mutate t2$6_@1[2:7] = read t0$5_@0
  [6] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [7] Return freeze t2$6_@1
```

## Reactive Scopes

```
function And(
) {
  scope @0 [1:2] deps=[] out=[$5_@0] {
    [1] Const mutate $5_@0 = Call mutate f$1:TFunction()
  }
  scope @1 [2:7] deps=[read $5_@0] out=[$6_@1] {
    [2] Let mutate $6_@1[2:7] = undefined
    if (read $5_@0) {
      [3] Const mutate $6_@1[2:7] = Call mutate g$4:TFunction()
    } else {
      [5] Const mutate $6_@1[2:7] = read $5_@0
    }
  }
  return freeze $6_@1
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
  let t2$6;

  if (c_1) {
    t2$6 = undefined;

    if (t0$5) {
      t2$6 = g$4();
    } else {
      t2$6 = t0$5;
    }

    $[1] = t0$5;
    $[2] = t2$6;
  } else {
    t2$6 = $[2];
  }

  return t2$6;
}

```
## HIR

```
bb0:
  [1] Const mutate t0$5_@0 = Call mutate f$1:TFunction()
  [2] Let mutate t2$6_@1[2:7] = undefined
  [2] If (read t0$5_@0) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate t2$6_@1[2:7] = read t0$5_@0
  [4] Goto bb1
bb3:
  predecessor blocks: bb0
  [5] Const mutate t2$6_@1[2:7] = Call mutate g$4:TFunction()
  [6] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [7] Return freeze t2$6_@1
```

## Reactive Scopes

```
function Or(
) {
  scope @0 [1:2] deps=[] out=[$5_@0] {
    [1] Const mutate $5_@0 = Call mutate f$1:TFunction()
  }
  scope @1 [2:7] deps=[read $5_@0] out=[$6_@1] {
    [2] Let mutate $6_@1[2:7] = undefined
    if (read $5_@0) {
      [3] Const mutate $6_@1[2:7] = read $5_@0
    } else {
      [5] Const mutate $6_@1[2:7] = Call mutate g$4:TFunction()
    }
  }
  return freeze $6_@1
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
  let t2$6;

  if (c_1) {
    t2$6 = undefined;

    if (t0$5) {
      t2$6 = t0$5;
    } else {
      t2$6 = g$4();
    }

    $[1] = t0$5;
    $[2] = t2$6;
  } else {
    t2$6 = $[2];
  }

  return t2$6;
}

```
## HIR

```
bb0:
  [1] Const mutate t0$9_@0:TPrimitive = Call mutate f$2:TFunction()
  [2] Const mutate $10:TPrimitive = null
  [3] Const mutate $11:TPrimitive = Binary read t0$9_@0:TPrimitive != read $10:TPrimitive
  [4] Let mutate t2$12_@1:TPrimitive[4:9] = undefined
  [4] If (read $11:TPrimitive) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [5] Const mutate t2$12_@1:TPrimitive[4:9] = read t0$9_@0:TPrimitive
  [6] Goto bb1
bb3:
  predecessor blocks: bb0
  [7] Const mutate t2$12_@1:TPrimitive[4:9] = Call mutate g$7:TFunction()
  [8] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [9] Return freeze t2$12_@1:TPrimitive
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
  scope @1 [4:9] deps=[read $9_@0:TPrimitive] out=[$12_@1] {
    [4] Let mutate $12_@1:TPrimitive[4:9] = undefined
    if (read $11:TPrimitive) {
      [5] Const mutate $12_@1:TPrimitive[4:9] = read $9_@0:TPrimitive
    } else {
      [7] Const mutate $12_@1:TPrimitive[4:9] = Call mutate g$7:TFunction()
    }
  }
  return freeze $12_@1:TPrimitive
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
  let t2$12;

  if (c_1) {
    t2$12 = undefined;

    if (t0$9 != null) {
      t2$12 = t0$9;
    } else {
      t2$12 = g$7();
    }

    $[1] = t0$9;
    $[2] = t2$12;
  } else {
    t2$12 = $[2];
  }

  return t2$12;
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
      