
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
  [1] Const mutate a$9_@1[1:7] = Call mutate compute$3:TFunction(read props$8.a)
  [2] Const mutate b$10_@1[1:7] = Call mutate compute$3:TFunction(read props$8.b)
  [3] If (read props$8.c) then:bb2 else:bb1 fallthrough=bb1
bb2:
  predecessor blocks: bb0
  [4] Call mutate mutate$5:TFunction(mutate a$9_@1)
  [5] Call mutate mutate$5:TFunction(mutate b$10_@1)
  [6] Goto bb1
bb1:
  predecessor blocks: bb2 bb0
  [7] Const mutate $14_@2 = JSX <read Foo$6 a={freeze a$9_@1} b={freeze b$10_@1} ></read Foo$6>
  [8] Return read $14_@2
scope1 [1:7]:
  - dependency: read props$8.a
scope2 [7:8]:
  - dependency: freeze a$9_@1
  - dependency: freeze b$10_@1
```

## Reactive Scopes

```
function Component(
  props,
) {
  scope @1 [1:7] deps=[read props$8.a] {
    [1] Const mutate a$9_@1[1:7] = Call mutate compute$3:TFunction(read props$8.a)
    [2] Const mutate b$10_@1[1:7] = Call mutate compute$3:TFunction(read props$8.b)
    if (read props$8.c) {
      [4] Call mutate mutate$5:TFunction(mutate a$9_@1)
      [5] Call mutate mutate$5:TFunction(mutate b$10_@1)
    }
  }
  scope @2 [7:8] deps=[freeze a$9_@1, freeze b$10_@1] {
    [7] Const mutate $14_@2 = JSX <read Foo$6 a={freeze a$9_@1} b={freeze b$10_@1} ></read Foo$6>
  }
  return read $14_@2
}

```

## Code

```javascript
function Component$0(props$8) {
  const a$9 = compute$3(props$8.a);
  const b$10 = compute$3(props$8.b);
  bb1: if (props$8.c) {
    mutate$5(a$9);
    mutate$5(b$10);
  }

  return <Foo$6 a={a$9} b={b$10}></Foo$6>;
}

```
      