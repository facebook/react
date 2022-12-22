
## Input

```javascript
function component(a, b) {
  if (a > b) {
    let m = {};
  }
}

```

## HIR

```
bb0:
  [1] Const mutate $7:TPrimitive = Binary read a$5:TPrimitive > read b$6:TPrimitive
  [2] If (read $7:TPrimitive) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate m$8_@0:TObject = Object {  }
  [4] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [5] Return
```

## Reactive Scopes

```
function component(
  a,
  b,
) {
  [1] Const mutate $7:TPrimitive = Binary read a$5:TPrimitive > read b$6:TPrimitive
  if (read $7:TPrimitive) {
    [3] Const mutate m$8_@0:TObject = Object {  }
  }
  return
}

```

## Code

```javascript
function component(a, b) {
  if (a > b) {
    const m = {};
  }
}

```
      