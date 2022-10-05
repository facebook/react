
## Input

```javascript
function Component(props) {
  const x = {};
  const y = [];
  x.y = y;
  const child = <Component data={y} />;
  x.y.push(props.p0);
  return <Component data={x}>{child}</Component>;
}

```

## HIR

```
bb0:
  readonly x$2 = Object {  }
  readonly y$3 = Array []
  readonly x$2.y = readonly y$3
  readonly child$4 = JSX <frozen Component$0 data={frozen y$3} ></frozen Component$0>
  Call mutable x$2.y.push(frozen props$1.p0)
  readonly $5 = JSX <frozen Component$0 data={frozen x$2} >{frozen child$4}</frozen Component$0>
  Return frozen $5
```

## Code

```javascript
function Component$0(props$1) {
  x$2 = {};
  y$3 = [];
  x$2 = y$3;
  child$4 = <Component$0 data={y$3}></Component$0>;
  x$2.y.push(props$1.p0);
  return <Component$0 data={x$2}>{child$4}</Component$0>;
}

```
      