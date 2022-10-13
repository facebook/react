
## Input

```javascript
/**
 * Should produce 1 scope:
 *
 * return: inputs=props.a & props.b; outputs=return
 *   const a = compute(props.a);
 *   const b = compute(props.b);
 *   foo(a, b);
 *   return = <Foo a={a} b={b} />
 */
function Component(props) {
  const a = compute(props.a);
  const b = compute(props.b);
  foo(a, b);
  return <Foo a={a} b={b} />;
}

function compute() {}
function foo() {}
function Foo() {}

```

## HIR

```
bb0:
  Const mutate a$2 = Call mutate compute$3(read props$1.a)
  Const mutate b$4 = Call mutate compute$3(read props$1.b)
  Call mutate foo$5(mutate a$2, mutate b$4)
  Const mutate $7 = JSX <read Foo$6 a={freeze a$2} b={freeze b$4} ></read Foo$6>
  Return read $7
```

## Code

```javascript
function Component$0(props$1) {
  const a$2 = compute$3(props$1.a);
  const b$4 = compute$3(props$1.b);
  foo$5(a$2, b$4);
  return <Foo$6 a={a$2} b={b$4}></Foo$6>;
}

```
## HIR

```
bb0:
  Return
```

## Code

```javascript
function compute$0() {
  return;
}

```
## HIR

```
bb0:
  Return
```

## Code

```javascript
function foo$0() {
  return;
}

```
## HIR

```
bb0:
  Return
```

## Code

```javascript
function Foo$0() {
  return;
}

```
      