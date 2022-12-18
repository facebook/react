
## Input

```javascript
function mutate() {}
function cond() {}

function Component(props) {
  let a = {};
  let b = {};
  let c = {};
  let d = {};
  while (true) {
    mutate(a, b);
    if (cond(a)) {
      break;
    }
  }

  // all of these tests are seemingly readonly, since the values are never directly
  // mutated again. but they are all aliased by `d`, which is later modified, and
  // these are therefore mutable references:
  if (a) {
  }
  if (b) {
  }
  if (c) {
  }
  if (d) {
  }

  mutate(d, null);
}

```

## HIR

```
bb0:
  [1] Return
```

## Reactive Scopes

```
function mutate(
) {
  return
}

```

## Code

```javascript
function mutate$0() {}

```
## HIR

```
bb0:
  [1] Return
```

## Reactive Scopes

```
function cond(
) {
  return
}

```

## Code

```javascript
function cond$0() {}

```
## HIR

```
bb0:
  [1] Const mutate a$12_@0:TObject[1:18] = Object {  }
  [2] Const mutate b$13_@0:TObject[1:18] = Object {  }
  [3] Const mutate c$14_@1:TObject = Object {  }
  [4] Const mutate d$15_@0:TObject[1:18] = Object {  }
  [5] While test=bb1 loop=bb3 fallthrough=bb2
bb1:
  predecessor blocks: bb0 bb4
  [6] Const mutate $16:TPrimitive = true
  [7] If (read $16:TPrimitive) then:bb3 else:bb2 fallthrough=bb2
bb3:
  predecessor blocks: bb1
  [8] Call mutate mutate$6:TFunction(mutate a$12_@0:TObject, mutate b$13_@0:TObject)
  [9] Const mutate $21_@0[1:18] = Call mutate cond$7:TFunction(mutate a$12_@0:TObject)
  [10] If (read $21_@0) then:bb2 else:bb4 fallthrough=bb4
bb4:
  predecessor blocks: bb3
  [11] Goto(Continue) bb1
bb2:
  predecessor blocks: bb3 bb1
  [12] If (read a$12_@0:TObject) then:bb7 else:bb7 fallthrough=bb7
bb7:
  predecessor blocks: bb2
  [13] If (read b$13_@0:TObject) then:bb9 else:bb9 fallthrough=bb9
bb9:
  predecessor blocks: bb7
  [14] If (read c$14_@1:TObject) then:bb11 else:bb11 fallthrough=bb11
bb11:
  predecessor blocks: bb9
  [15] If (read d$15_@0:TObject) then:bb13 else:bb13 fallthrough=bb13
bb13:
  predecessor blocks: bb11
  [16] Const mutate $28:TPrimitive = null
  [17] Call mutate mutate$6:TFunction(mutate d$15_@0:TObject, read $28:TPrimitive)
  [18] Return
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:18] deps=[] out=[] {
    [1] Const mutate a$12_@0:TObject[1:18] = Object {  }
    [2] Const mutate b$13_@0:TObject[1:18] = Object {  }
    scope @1 [3:4] deps=[] out=[c$14_@1] {
      [3] Const mutate c$14_@1:TObject = Object {  }
    }
    [4] Const mutate d$15_@0:TObject[1:18] = Object {  }
    while (
      [6] Const mutate $16:TPrimitive = true
      read $16:TPrimitive
    ) {
      [8] Call mutate mutate$6:TFunction(mutate a$12_@0:TObject, mutate b$13_@0:TObject)
      [9] Const mutate $21_@0[1:18] = Call mutate cond$7:TFunction(mutate a$12_@0:TObject)
      if (read $21_@0) {
        break
      }
    }
    if (read a$12_@0:TObject) {
    }
    if (read b$13_@0:TObject) {
    }
    if (read c$14_@1:TObject) {
    }
    if (read d$15_@0:TObject) {
    }
    [16] Const mutate $28:TPrimitive = null
    [17] Call mutate mutate$6:TFunction(mutate d$15_@0:TObject, read $28:TPrimitive)
  }
  return
}

```

## Code

```javascript
function Component$0(props$11) {
  const $ = React.useMemoCache();
  if (true) {
    const a$12 = {};
    const b$13 = {};
    let c$14;

    if (true) {
      c$14 = {};
      $[0] = c$14;
    } else {
      c$14 = $[0];
    }

    const d$15 = {};

    while (true) {
      mutate$6(a$12, b$13);

      if (cond$7(a$12)) {
        break;
      }
    }

    if (a$12) {
    }

    if (b$13) {
    }

    if (c$14) {
    }

    if (d$15) {
    }

    mutate$6(d$15, null);
  } else {
  }
}

```
      