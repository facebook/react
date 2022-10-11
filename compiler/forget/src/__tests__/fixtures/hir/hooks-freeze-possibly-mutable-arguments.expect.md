
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
  Const mutable cond$2 = readonly props$1.cond
  Const mutable x$3 = readonly props$1.x
  Let mutable a$4 = undefined
  If (readonly cond$2) then:bb2 else:bb3
bb2:
  Reassign mutable a$4 = readonly x$3
  Goto bb1
bb3:
  Reassign mutable a$4 = Array []
  Goto bb1
bb1:
  Call readonly useFreeze$5(freeze a$4)
  Call readonly useFreeze$5(readonly a$4)
  Call mutable call$6(readonly a$4)
  Return readonly a$4
```

## Code

```javascript
function Component$0(props$1) {
  const cond$2 = props$1.cond;
  const x$3 = props$1.x;
  let a$4 = undefined;
  if (cond$2) {
    a$4 = x$3;
    ("<<TODO: handle complex control flow in codegen>>");
  } else {
    a$4 = [];
    ("<<TODO: handle complex control flow in codegen>>");
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
function useFreeze$0(x$1) {
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
function call$0(x$1) {
  return;
}

```
      