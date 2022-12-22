
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
  [4] Let mutate a$0$14_@0[4:9] = undefined
  [4] If (read cond$8) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [5] Const mutate a$1$11 = read x$9
  [6] Reassign mutate a$0$14_@0[4:9] = read a$1$11
  [6] Goto bb1
bb3:
  predecessor blocks: bb0
  [7] Const mutate a$2$12_@1 = Array []
  [8] Reassign mutate a$0$14_@0[4:9] = read a$2$12_@1
  [8] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [9] Call read useFreeze$5:TFunction(freeze a$0$14_@0)
  [10] Call read useFreeze$5:TFunction(read a$0$14_@0)
  [11] Call mutate call$6:TFunction(read a$0$14_@0)
  [12] Return read a$0$14_@0
```

## Reactive Scopes

```
function Component(
  props,
) {
  [1] Const mutate cond$8 = read props$7.cond
  [2] Const mutate x$9 = read props$7.x
  [3] Const mutate a$10:TPrimitive = undefined
  scope @0 [4:9] deps=[read cond$8, read x$9] out=[a$0$14_@0] {
    [4] Let mutate a$0$14_@0[4:9] = undefined
    if (read cond$8) {
      [5] Const mutate a$1$11 = read x$9
      [6] Reassign mutate a$0$14_@0[4:9] = read a$1$11
    } else {
      scope @1 [7:8] deps=[] out=[a$2$12_@1] {
        [7] Const mutate a$2$12_@1 = Array []
      }
      [8] Reassign mutate a$0$14_@0[4:9] = read a$2$12_@1
    }
  }
  [9] Call read useFreeze$5:TFunction(freeze a$0$14_@0)
  [10] Call read useFreeze$5:TFunction(read a$0$14_@0)
  [11] Call mutate call$6:TFunction(read a$0$14_@0)
  return read a$0$14_@0
}

```

## Code

```javascript
function Component(props) {
  const $ = React.useMemoCache();
  const cond = props.cond;
  const x = props.x;
  const a = undefined;
  const c_0 = $[0] !== cond;
  const c_1 = $[1] !== x;
  let a$0;
  if (c_0 || c_1) {
    a$0 = undefined;

    if (cond) {
      const a$1 = x;
      a$0 = a$1;
    } else {
      let a$2;

      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        a$2 = [];
        $[3] = a$2;
      } else {
        a$2 = $[3];
      }

      a$0 = a$2;
    }

    $[0] = cond;
    $[1] = x;
    $[2] = a$0;
  } else {
    a$0 = $[2];
  }

  useFreeze(a$0);
  useFreeze(a$0);
  call(a$0);
  return a$0;
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
function useFreeze(x) {}

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
function call(x) {}

```
      