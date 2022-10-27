
## Input

```javascript
function Component(props) {
  const a = 1;
  const b = 2;
  const x = [a, b];
  return x;
}

```

## HIR

```
bb0:
  Const mutate a$5 = 1
  Const mutate b$6 = 2
  Const mutate x$7 = Array [read a$5, read b$6]
  Return freeze x$7
```

## Code

```javascript
function Component$0(props$1) {
  const a$5 = 1;
  const b$6 = 2;
  const x$7 = [a$5, b$6];
  return x$7;
}

```
      