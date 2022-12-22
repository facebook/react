
## Input

```javascript
function Component(props) {
  const a = [];
  const b = [];
  if (b) {
    a.push(props.p0);
  }
  if (props.p1) {
    b.push(props.p2);
  }
  return <Foo a={a} b={b} />;
}

function Component(props) {
  const a = [];
  const b = [];
  if (mayMutate(b)) {
    a.push(props.p0);
  }
  if (props.p1) {
    b.push(props.p2);
  }
  return <Foo a={a} b={b} />;
}

function Foo() {}
function mayMutate() {}

```

## HIR

```
bb0:
  [1] Const mutate a$7_@0[1:9] = Array []
  [2] Const mutate b$8_@0[1:9] = Array []
  [3] If (read b$8_@0) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [4] Call mutate a$7_@0.push(read props$6.p0)
  [5] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [6] If (read props$6.p1) then:bb4 else:bb3 fallthrough=bb3
bb4:
  predecessor blocks: bb1
  [7] Call mutate b$8_@0.push(read props$6.p2)
  [8] Goto bb3
bb3:
  predecessor blocks: bb4 bb1
  [9] Const mutate t6$16_@2 = JSX <read Foo$4 a={freeze a$7_@0} b={freeze b$8_@0} ></read Foo$4>
  [10] Return read t6$16_@2
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:9] deps=[read props$6.p0, read props$6.p1, read props$6.p2] out=[a$7_@0] {
    [1] Const mutate a$7_@0[1:9] = Array []
    [2] Const mutate b$8_@0[1:9] = Array []
    if (read b$8_@0) {
      [4] Call mutate a$7_@0.push(read props$6.p0)
    }
    if (read props$6.p1) {
      [7] Call mutate b$8_@0.push(read props$6.p2)
    }
  }
  scope @2 [9:10] deps=[freeze a$7_@0, freeze b$8_@0] out=[$16_@2] {
    [9] Const mutate $16_@2 = JSX <read Foo$4 a={freeze a$7_@0} b={freeze b$8_@0} ></read Foo$4>
  }
  return read $16_@2
}

```

## Code

```javascript
function Component(props) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props.p0;
  const c_1 = $[1] !== props.p1;
  const c_2 = $[2] !== props.p2;
  let a;
  if (c_0 || c_1 || c_2) {
    a = [];
    const b = [];

    if (b) {
      a.push(props.p0);
    }

    if (props.p1) {
      b.push(props.p2);
    }

    $[0] = props.p0;
    $[1] = props.p1;
    $[2] = props.p2;
    $[3] = a;
  } else {
    a = $[3];
  }

  const c_4 = $[4] !== a;
  const c_5 = $[5] !== b;
  let t6;

  if (c_4 || c_5) {
    t6 = <Foo a={a} b={b}></Foo>;
    $[4] = a;
    $[5] = b;
    $[6] = t6;
  } else {
    t6 = $[6];
  }

  return t6;
}

```
## HIR

```
bb0:
  [1] Const mutate a$9_@0[1:10] = Array []
  [2] Const mutate b$10_@0[1:10] = Array []
  [3] Const mutate $11_@0[1:10] = Call mutate mayMutate$4:TFunction(mutate b$10_@0)
  [4] If (read $11_@0) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [5] Call mutate a$9_@0.push(read props$8.p0)
  [6] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [7] If (read props$8.p1) then:bb4 else:bb3 fallthrough=bb3
bb4:
  predecessor blocks: bb1
  [8] Call mutate b$10_@0.push(read props$8.p2)
  [9] Goto bb3
bb3:
  predecessor blocks: bb4 bb1
  [10] Const mutate t6$19_@2 = JSX <read Foo$6 a={freeze a$9_@0} b={freeze b$10_@0} ></read Foo$6>
  [11] Return read t6$19_@2
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:10] deps=[read props$8.p0, read props$8.p1, read props$8.p2] out=[a$9_@0] {
    [1] Const mutate a$9_@0[1:10] = Array []
    [2] Const mutate b$10_@0[1:10] = Array []
    [3] Const mutate $11_@0[1:10] = Call mutate mayMutate$4:TFunction(mutate b$10_@0)
    if (read $11_@0) {
      [5] Call mutate a$9_@0.push(read props$8.p0)
    }
    if (read props$8.p1) {
      [8] Call mutate b$10_@0.push(read props$8.p2)
    }
  }
  scope @2 [10:11] deps=[freeze a$9_@0, freeze b$10_@0] out=[$19_@2] {
    [10] Const mutate $19_@2 = JSX <read Foo$6 a={freeze a$9_@0} b={freeze b$10_@0} ></read Foo$6>
  }
  return read $19_@2
}

```

## Code

```javascript
function Component(props) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props.p0;
  const c_1 = $[1] !== props.p1;
  const c_2 = $[2] !== props.p2;
  let a;
  if (c_0 || c_1 || c_2) {
    a = [];
    const b = [];

    if (mayMutate(b)) {
      a.push(props.p0);
    }

    if (props.p1) {
      b.push(props.p2);
    }

    $[0] = props.p0;
    $[1] = props.p1;
    $[2] = props.p2;
    $[3] = a;
  } else {
    a = $[3];
  }

  const c_4 = $[4] !== a;
  const c_5 = $[5] !== b;
  let t6;

  if (c_4 || c_5) {
    t6 = <Foo a={a} b={b}></Foo>;
    $[4] = a;
    $[5] = b;
    $[6] = t6;
  } else {
    t6 = $[6];
  }

  return t6;
}

```
## HIR

```
bb0:
  [1] Return
```

## Reactive Scopes

```
function Foo(
) {
  return
}

```

## Code

```javascript
function Foo() {}

```
## HIR

```
bb0:
  [1] Return
```

## Reactive Scopes

```
function mayMutate(
) {
  return
}

```

## Code

```javascript
function mayMutate() {}

```
      