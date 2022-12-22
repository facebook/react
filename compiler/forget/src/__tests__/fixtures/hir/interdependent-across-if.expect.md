
## Input

```javascript
function compute() {}
function foo() {}
function Foo() {}

/**
 * Should produce 1 scope:
 *
 * return: inputs=props.a & props.b & props.c; outputs=return
 *   const a = compute(props.a);
 *   const b = compute(props.b);
 *   if (props.c)
 *     foo(a, b);
 *   return = <Foo a={a} b={b} />
 */
function Component(props) {
  const a = compute(props.a);
  const b = compute(props.b);
  if (props.c) {
    foo(a, b);
  }
  return <Foo a={a} b={b} />;
}

```

## HIR

```
bb0:
  [1] Return
```

## Reactive Scopes

```
function compute(
) {
  return
}

```

## Code

```javascript
function compute() {}

```
## HIR

```
bb0:
  [1] Return
```

## Reactive Scopes

```
function foo(
) {
  return
}

```

## Code

```javascript
function foo() {}

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
  [1] Const mutate a$9_@0[1:6] = Call mutate compute$2:TFunction(read props$8.a)
  [2] Const mutate b$10_@0[1:6] = Call mutate compute$2:TFunction(read props$8.b)
  [3] If (read props$8.c) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [4] Call mutate foo$5:TFunction(mutate a$9_@0, mutate b$10_@0)
  [5] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [6] Const mutate t7$14_@1 = JSX <read Foo$6 a={freeze a$9_@0} b={freeze b$10_@0} ></read Foo$6>
  [7] Return read t7$14_@1
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @0 [1:6] deps=[read props$8.a, read props$8.b, read props$8.c] out=[a$9_@0, b$10_@0] {
    [1] Const mutate a$9_@0[1:6] = Call mutate compute$2:TFunction(read props$8.a)
    [2] Const mutate b$10_@0[1:6] = Call mutate compute$2:TFunction(read props$8.b)
    if (read props$8.c) {
      [4] Call mutate foo$5:TFunction(mutate a$9_@0, mutate b$10_@0)
    }
  }
  scope @1 [6:7] deps=[freeze a$9_@0, freeze b$10_@0] out=[$14_@1] {
    [6] Const mutate $14_@1 = JSX <read Foo$6 a={freeze a$9_@0} b={freeze b$10_@0} ></read Foo$6>
  }
  return read $14_@1
}

```

## Code

```javascript
function Component(props) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props.a;
  const c_1 = $[1] !== props.b;
  const c_2 = $[2] !== props.c;
  let a;
  let b;
  if (c_0 || c_1 || c_2) {
    a = compute(props.a);
    b = compute(props.b);

    if (props.c) {
      foo(a, b);
    }

    $[0] = props.a;
    $[1] = props.b;
    $[2] = props.c;
    $[3] = a;
    $[4] = b;
  } else {
    a = $[3];
    b = $[4];
  }

  const c_5 = $[5] !== a;
  const c_6 = $[6] !== b;
  let t7;

  if (c_5 || c_6) {
    t7 = <Foo a={a} b={b}></Foo>;
    $[5] = a;
    $[6] = b;
    $[7] = t7;
  } else {
    t7 = $[7];
  }

  return t7;
}

```
      