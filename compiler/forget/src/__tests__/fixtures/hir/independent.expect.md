
## Input

```javascript
/**
 * Should produce 3 scopes:
 *
 * a: inputs=props.a, outputs=a
 *   a = compute(props.a);
 * b: inputs=props.b, outputs=b
 *   b = compute(props.b);
 * return: inputs=a, b outputs=return
 *   return = <Foo a={a} b={b} />
 */
function Component(props) {
  const a = compute(props.a);
  const b = compute(props.b);
  return <Foo a={a} b={b} />;
}

function compute() {}
function foo() {}
function Foo() {}

```

## HIR

```
bb0:
  frozen a$2 = Call mutable compute$3(frozen props$1.a)
  frozen b$4 = Call mutable compute$3(frozen props$1.b)
  frozen $6 = JSX <frozen Foo$5 a={frozen a$2} b={frozen b$4} ></frozen Foo$5>
  Return frozen $6
```

## Code

```javascript
function Component$0(props$1) {
  a$2 = compute$3(props$1.a);
  b$4 = compute$3(props$1.b);
  return <Foo$5 a={a$2} b={b$4}></Foo$5>;
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
      