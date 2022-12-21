
## Input

```javascript
function Component(props) {
  const cond = props.cond;
  const x = props.x;
  let a;
  if (cond) {
    a = x;
  } else {
    a = [];
  }
  useFreeze(a); // should freeze, value *may* be mutable
  useFreeze(a); // should be readonly
  call(a); // should be readonly
  return a;
}

function useFreeze(x) {}
function call(x) {}

```

## HIR

```
bb0:
  [1] Const mutate cond$8 = read props$7.cond
  [2] Const mutate x$9 = read props$7.x
  [3] Const mutate a$10:TPrimitive = undefined
  [4] Let mutate a$14_@0[4:9] = undefined
  [4] If (read cond$8) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [5] Const mutate a$11 = read x$9
  [6] Reassign mutate a$14_@0[4:9] = read a$11
  [6] Goto bb1
bb3:
  predecessor blocks: bb0
  [7] Const mutate a$12_@1 = Array []
  [8] Reassign mutate a$14_@0[4:9] = read a$12_@1
  [8] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [9] Call read useFreeze$5:TFunction(freeze a$14_@0)
  [10] Call read useFreeze$5:TFunction(read a$14_@0)
  [11] Call mutate call$6:TFunction(read a$14_@0)
  [12] Return read a$14_@0
```

## Reactive Scopes

```
function Component(
  props,
) {
  [1] Const mutate cond$8 = read props$7.cond
  [2] Const mutate x$9 = read props$7.x
  [3] Const mutate a$10:TPrimitive = undefined
  scope @0 [4:9] deps=[read cond$8, read x$9] out=[a$14_@0] {
    [4] Let mutate a$14_@0[4:9] = undefined
    if (read cond$8) {
      [5] Const mutate a$11 = read x$9
      [6] Reassign mutate a$14_@0[4:9] = read a$11
    } else {
      scope @1 [7:8] deps=[] out=[a$12_@1] {
        [7] Const mutate a$12_@1 = Array []
      }
      [8] Reassign mutate a$14_@0[4:9] = read a$12_@1
    }
  }
  [9] Call read useFreeze$5:TFunction(freeze a$14_@0)
  [10] Call read useFreeze$5:TFunction(read a$14_@0)
  [11] Call mutate call$6:TFunction(read a$14_@0)
  return read a$14_@0
}

```

## Code

```javascript
function Component$0(props$7) {
  const $ = React.useMemoCache();
  const cond$8 = props$7.cond;
  const x$9 = props$7.x;
  const a$10 = undefined;
  const c_0 = $[0] !== cond$8;
  const c_1 = $[1] !== x$9;
  let a$14;
  if (c_0 || c_1) {
    a$14 = undefined;

    if (cond$8) {
      const a$11 = x$9;
      a$14 = a$11;
    } else {
      let a$12;

      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        a$12 = [];
        $[3] = a$12;
      } else {
        a$12 = $[3];
      }

      a$14 = a$12;
    }

    $[0] = cond$8;
    $[1] = x$9;
    $[2] = a$14;
  } else {
    a$14 = $[2];
  }

  useFreeze$5(a$14);
  useFreeze$5(a$14);
  call$6(a$14);
  return a$14;
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
  x,
) {
  return
}

```

## Code

```javascript
function useFreeze$0(x$2) {}

```
## HIR

```
bb0:
  [1] Return
```

## Reactive Scopes

```
function call(
  x,
) {
  return
}

```

## Code

```javascript
function call$0(x$2) {}

```
      