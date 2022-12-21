
## Input

```javascript
function compute() {}
function mutate() {}
function foo() {}
function Foo() {}

/**
 * Should produce 3 scopes:
 *
 * a: inputs=props.a & props.c; outputs=a
 *   a = compute(props.a);
 *   if (props.c)
 *     mutate(a)
 * b: inputs=props.b & props.c; outputs=b
 *   b = compute(props.b);
 *   if (props.c)
 *     mutate(b)
 * return: inputs=a, b outputs=return
 *   return = <Foo a={a} b={b} />
 */
function Component(props) {
  const a = compute(props.a);
  const b = compute(props.b);
  if (props.c) {
    mutate(a);
    mutate(b);
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
function compute$0() {}

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
function foo(
) {
  return
}

```

## Code

```javascript
function foo$0() {}

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
function Foo$0() {}

```
## HIR

```
bb0:
  [1] Const mutate a$9_@1[1:7] = Call mutate compute$2:TFunction(read props$8.a)
  [2] Const mutate b$10_@1[1:7] = Call mutate compute$2:TFunction(read props$8.b)
  [3] If (read props$8.c) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [4] Call mutate mutate$5:TFunction(mutate a$9_@1)
  [5] Call mutate mutate$5:TFunction(mutate b$10_@1)
  [6] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [7] Const mutate t6$14_@2 = JSX <read Foo$6 a={freeze a$9_@1} b={freeze b$10_@1} ></read Foo$6>
  [8] Return read t6$14_@2
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @1 [1:7] deps=[read props$8.a, read props$8.b, read props$8.c] out=[a$9_@1] {
    [1] Const mutate a$9_@1[1:7] = Call mutate compute$2:TFunction(read props$8.a)
    [2] Const mutate b$10_@1[1:7] = Call mutate compute$2:TFunction(read props$8.b)
    if (read props$8.c) {
      [4] Call mutate mutate$5:TFunction(mutate a$9_@1)
      [5] Call mutate mutate$5:TFunction(mutate b$10_@1)
    }
  }
  scope @2 [7:8] deps=[freeze a$9_@1, freeze b$10_@1] out=[$14_@2] {
    [7] Const mutate $14_@2 = JSX <read Foo$6 a={freeze a$9_@1} b={freeze b$10_@1} ></read Foo$6>
  }
  return read $14_@2
}

```

## Code

```javascript
function Component$0(props$8) {
  const $ = React.useMemoCache();
  const c_0 = $[0] !== props$8.a;
  const c_1 = $[1] !== props$8.b;
  const c_2 = $[2] !== props$8.c;
  let a$9;
  if (c_0 || c_1 || c_2) {
    a$9 = compute$2(props$8.a);
    const b$10 = compute$2(props$8.b);

    if (props$8.c) {
      mutate$5(a$9);
      mutate$5(b$10);
    }

    $[0] = props$8.a;
    $[1] = props$8.b;
    $[2] = props$8.c;
    $[3] = a$9;
  } else {
    a$9 = $[3];
  }

  const c_4 = $[4] !== a$9;
  const c_5 = $[5] !== b$10;
  let t6$14;

  if (c_4 || c_5) {
    t6$14 = <Foo$6 a={a$9} b={b$10}></Foo$6>;
    $[4] = a$9;
    $[5] = b$10;
    $[6] = t6$14;
  } else {
    t6$14 = $[6];
  }

  return t6$14;
}

```
      