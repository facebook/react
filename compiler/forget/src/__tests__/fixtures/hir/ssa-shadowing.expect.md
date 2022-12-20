
## Input

```javascript
function log() {}

function Foo(cond) {
  let str = "";
  if (cond) {
    let str = "other test";
    log(str);
  } else {
    str = "fallthrough test";
  }
  log(str);
}

```

## HIR

```
bb0:
  [1] Return
```

## Reactive Scopes

```
function log(
) {
  return
}

```

## Code

```javascript
function log$0() {}

```
## HIR

```
bb0:
  [1] Const mutate str$6:TPrimitive = ""
  [2] Let mutate str$10_@0[1:8] = read str$6:TPrimitive
  [2] If (read cond$5) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate str$7:TPrimitive = "other test"
  [4] Call mutate log$4:TFunction(read str$7:TPrimitive)
  [5] Goto bb1
bb3:
  predecessor blocks: bb0
  [6] Const mutate str$8:TPrimitive = "fallthrough test"
  [7] Reassign mutate str$10_@0[1:8] = read str$8:TPrimitive
  [7] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [8] Call mutate log$4:TFunction(read str$10_@0)
  [9] Return
```

## Reactive Scopes

```
function Foo(
  cond,
) {
  [1] Const mutate str$6:TPrimitive = ""
  scope @0 [1:8] deps=[read cond$5] out=[str$10_@0] {
    [2] Let mutate str$10_@0[1:8] = read str$6:TPrimitive
    if (read cond$5) {
      [3] Const mutate str$7:TPrimitive = "other test"
      [4] Call mutate log$4:TFunction(read str$7:TPrimitive)
    } else {
      [6] Const mutate str$8:TPrimitive = "fallthrough test"
      [7] Reassign mutate str$10_@0[1:8] = read str$8:TPrimitive
    }
  }
  [8] Call mutate log$4:TFunction(read str$10_@0)
  return
}

```

## Code

```javascript
function Foo$0(cond$5) {
  const $ = React.useMemoCache();
  const str$6 = "";
  const c_0 = $[0] !== cond$5;
  let str$10;
  if (c_0) {
    str$10 = str$6;

    if (cond$5) {
      const str$7 = "other test";
      log$4(str$7);
    } else {
      const str$8 = "fallthrough test";
      str$10 = str$8;
    }

    $[0] = cond$5;
    $[1] = str$10;
  } else {
    str$10 = $[1];
  }

  log$4(str$10);
}

```
      