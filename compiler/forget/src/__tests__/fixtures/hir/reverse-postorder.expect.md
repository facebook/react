
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
  [1] Let mutate x$7 = undefined
  If (read props$6.cond) then:bb2 else:bb10
bb2:
  predecessor blocks: bb0
  [2] Const mutate $8 = 2
  [3] Const mutate $9 = 1
  [4] Const mutate $10 = 0
  Switch (read props$6.test)
    Case read $10: bb8
    Case read $9: bb6
    Case read $8: bb4
    Default: bb4
bb8:
  predecessor blocks: bb2
  [5] Reassign mutate x$2 = read props$6.v0
  Goto bb1
bb6:
  predecessor blocks: bb2
  [6] Reassign mutate x$2 = read props$6.v1
  Goto bb1
bb4:
  predecessor blocks: bb2
  [7] Reassign mutate x$2 = read props$6.v2
  Goto bb1
bb10:
  predecessor blocks: bb0
  If (read props$6.cond2) then:bb12 else:bb13
bb12:
  predecessor blocks: bb10
  [8] Reassign mutate x$2 = read props$6.b
  Goto bb1
bb13:
  predecessor blocks: bb10
  [9] Reassign mutate x$2 = read props$6.c
  Goto bb1
bb1:
  predecessor blocks: bb8 bb6 bb4 bb12 bb13
  [10] read x$2
  Return
```

## Code

```javascript
function Component$0(props$6) {
  let x$7 = undefined;
  bb1: if (props$6.cond) {
    switch (props$6.test) {
      case 0: {
        x$2 = props$6.v0;
        break bb1;
      }

      case 1: {
        x$2 = props$6.v1;
        break bb1;
      }

      case 2: {
      }

      default: {
        x$2 = props$6.v2;
      }
    }
  } else {
    if (props$6.cond2) {
      x$2 = props$6.b;
    } else {
      x$2 = props$6.c;
    }
  }

  x$2;
  return;
}

```
      