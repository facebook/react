
## Input

```javascript
function Component(props) {
  let x;
  if (props.cond) {
    switch (props.test) {
      case 0: {
        x = props.v0;
        break;
      }
      case 1: {
        x = props.v1;
        break;
      }
      case 2: {
      }
      default: {
        x = props.v2;
      }
    }
  } else {
    if (props.cond2) {
      x = props.b;
    } else {
      x = props.c;
    }
  }
  x;
}

```

## HIR

```
bb0:
  Let mutate x$2 = undefined
  If (read props$1.cond) then:bb2 else:bb10
bb2:
  predecessor blocks: bb0
  Const mutate $3 = 2
  Const mutate $4 = 1
  Const mutate $5 = 0
  Switch (<unknown> props$1.test)
    Case read $5: bb8
    Case read $4: bb6
    Case read $3: bb4
    Default: bb4
bb8:
  predecessor blocks: bb2
  Reassign mutate x$2 = read props$1.v0
  Goto bb1
bb6:
  predecessor blocks: bb2
  Reassign mutate x$2 = read props$1.v1
  Goto bb1
bb4:
  predecessor blocks: bb2
  Reassign mutate x$2 = read props$1.v2
  Goto bb1
bb10:
  predecessor blocks: bb0
  If (read props$1.cond2) then:bb12 else:bb13
bb12:
  predecessor blocks: bb10
  Reassign mutate x$2 = read props$1.b
  Goto bb1
bb13:
  predecessor blocks: bb10
  Reassign mutate x$2 = read props$1.c
  Goto bb1
bb1:
  predecessor blocks: bb13 bb12 bb8 bb6 bb4
  read x$2
  Return
```

## Code

```javascript
function Component$0(props$1) {
  let x$2 = undefined;
  if (props$1.cond) {
    switch (props$1.test) {
      case 0: {
        x$2 = props$1.v0;
        ("<<TODO: handle complex control flow in codegen>>");
      }
      case 1: {
        x$2 = props$1.v1;
        ("<<TODO: handle complex control flow in codegen>>");
      }
      case 2: {
        x$2 = props$1.v2;
        ("<<TODO: handle complex control flow in codegen>>");
      }
      default: {
        x$2 = props$1.v2;
        ("<<TODO: handle complex control flow in codegen>>");
      }
    }
    x$2;
    return;
  } else {
    if (props$1.cond2) {
      x$2 = props$1.b;
      ("<<TODO: handle complex control flow in codegen>>");
    } else {
      x$2 = props$1.c;
      ("<<TODO: handle complex control flow in codegen>>");
    }
    x$2;
    return;
  }
  x$2;
  return;
}

```
      