
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
function log() {}

```
## HIR

```
bb0:
  [1] Const mutate str$6:TPrimitive = ""
  [2] Let mutate str$0$10_@0[1:8] = read str$6:TPrimitive
  [2] If (read cond$5) then:bb2 else:bb3 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [3] Const mutate str$1$7:TPrimitive = "other test"
  [4] Call mutate log$4:TFunction(read str$1$7:TPrimitive)
  [5] Goto bb1
bb3:
  predecessor blocks: bb0
  [6] Const mutate str$2$8:TPrimitive = "fallthrough test"
  [7] Reassign mutate str$0$10_@0[1:8] = read str$2$8:TPrimitive
  [7] Goto bb1
bb1:
  predecessor blocks: bb2 bb3
  [8] Call mutate log$4:TFunction(read str$0$10_@0)
  [9] Return
```

## Reactive Scopes

```
function Foo(
  cond,
) {
  [1] Const mutate str$6:TPrimitive = ""
  scope @0 [1:8] deps=[read cond$5] out=[str$0$10_@0] {
    [2] Let mutate str$0$10_@0[1:8] = read str$6:TPrimitive
    if (read cond$5) {
      [3] Const mutate str$1$7:TPrimitive = "other test"
      [4] Call mutate log$4:TFunction(read str$1$7:TPrimitive)
    } else {
      [6] Const mutate str$2$8:TPrimitive = "fallthrough test"
      [7] Reassign mutate str$0$10_@0[1:8] = read str$2$8:TPrimitive
    }
  }
  [8] Call mutate log$4:TFunction(read str$0$10_@0)
  return
}

```

## Code

```javascript
function Foo(cond) {
  const $ = React.useMemoCache();
  const str = "";
  const c_0 = $[0] !== cond;
  let str$0;
  if (c_0) {
    str$0 = str;

    if (cond) {
      const str$1 = "other test";
      log(str$1);
    } else {
      const str$2 = "fallthrough test";
      str$0 = str$2;
    }

    $[0] = cond;
    $[1] = str$0;
  } else {
    str$0 = $[1];
  }

  log(str$0);
}

```
      