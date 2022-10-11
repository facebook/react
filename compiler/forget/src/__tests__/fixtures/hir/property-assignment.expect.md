
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
  Const mutable x$2 = Object {  }
  Const mutable y$3 = Array []
  Reassign mutable x$2.y = readonly y$3
  Const mutable child$4 = JSX <readonly Component$0 data={freeze y$3} ></readonly Component$0>
  Call mutable x$2.y.push(readonly props$1.p0)
  Const mutable $5 = JSX <readonly Component$0 data={freeze x$2} >{readonly child$4}</readonly Component$0>
  Return readonly $5
```

## Code

```javascript
function Component$0(props$1) {
  const x$2 = {};
  const y$3 = [];
  x$2 = y$3;
  const child$4 = <Component$0 data={y$3}></Component$0>;
  x$2.y.push(props$1.p0);
  return <Component$0 data={x$2}>{child$4}</Component$0>;
}

```
      