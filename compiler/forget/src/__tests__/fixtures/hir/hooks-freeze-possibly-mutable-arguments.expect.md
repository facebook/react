
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
  [1] Const mutate cond$8:TProp = read props$7.cond
  [2] Const mutate x$9:TProp = read props$7.x
  [3] Const mutate a$10:TPrimitive = undefined
  [4] Let mutate a$11_@0:TProp[4:9] = undefined
  [4] If (read cond$8:TProp) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [5] Reassign mutate a$11_@0:TProp[4:9] = read x$9:TProp
  [6] Goto bb1
bb3:
  predecessor blocks: bb0
  [7] Reassign mutate a$11_@0:TProp[4:9] = Array []
  [8] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [9] Call read useFreeze$5:TFunction(freeze a$11_@0:TProp)
  [10] Call read useFreeze$5:TFunction(read a$11_@0:TProp)
  [11] Call mutate call$6:TFunction(read a$11_@0:TProp)
  [12] Return read a$11_@0:TProp
scope0 [4:9]:
  - dependency: read x$9:TProp
  - dependency: read cond$8:TProp
```

## Reactive Scopes

```
function Component(
  props,
) {
  [1] Const mutate cond$8:TProp = read props$7.cond
  [2] Const mutate x$9:TProp = read props$7.x
  [3] Const mutate a$10:TPrimitive = undefined
  scope @0 [4:9] deps=[read x$9:TProp, read cond$8:TProp] {
    [4] Let mutate a$11_@0:TProp[4:9] = undefined
    if (read cond$8:TProp) {
      [5] Reassign mutate a$11_@0:TProp[4:9] = read x$9:TProp
    } else {
      [7] Reassign mutate a$11_@0:TProp[4:9] = Array []
    }
  }
  [9] Call read useFreeze$5:TFunction(freeze a$11_@0:TProp)
  [10] Call read useFreeze$5:TFunction(read a$11_@0:TProp)
  [11] Call mutate call$6:TFunction(read a$11_@0:TProp)
  return read a$11_@0:TProp
}

```

## Code

```javascript
function Component$0(props$7) {
  const cond$8 = props$7.cond;
  const x$9 = props$7.x;
  const a$10 = undefined;
  let a$11 = undefined;
  bb1: if (cond$8) {
    a$11 = x$9;
  } else {
    a$11 = [];
  }

  useFreeze$5(a$11);
  useFreeze$5(a$11);
  call$6(a$11);
  return a$11;
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
      