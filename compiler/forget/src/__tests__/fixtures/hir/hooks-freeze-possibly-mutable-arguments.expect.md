
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
  [3] Let mutate a$10 = undefined
  If (read cond$8) then:bb2 else:bb3
bb2:
  predecessor blocks: bb0
  [4] Reassign mutate a$4 = read x$9
  Goto bb1
bb3:
  predecessor blocks: bb0
  [5] Reassign mutate a$4 = Array []
  Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [6] Call read useFreeze$5(freeze a$4)
  [7] Call read useFreeze$5(read a$4)
  [8] Call mutate call$6(read a$4)
  Return read a$4
```

## Code

```javascript
function Component$0(props$7) {
  const cond$8 = props$7.cond;
  const x$9 = props$7.x;
  let a$10 = undefined;
  bb1: if (cond$8) {
    a$4 = x$9;
  } else {
    a$4 = [];
  }

  useFreeze$5(a$4);
  useFreeze$5(a$4);
  call$6(a$4);
  return a$4;
}

```
## HIR

```
bb0:
  Return
```

## Code

```javascript
function useFreeze$0(x$2) {
  return;
}

```
## HIR

```
bb0:
  Return
```

## Code

```javascript
function call$0(x$2) {
  return;
}

```
      