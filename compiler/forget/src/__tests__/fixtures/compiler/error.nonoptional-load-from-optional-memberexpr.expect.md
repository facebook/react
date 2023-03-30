
## Input

```javascript
// Note that `a?.b.c` is semantically different from `(a?.b).c`
// Here, 'props?.a` is an optional chain, and `.b` is an unconditional load
// (nullthrows if a is nullish)

function Component(props) {
  let x = (props?.a).b;
  return x;
}

```


## Error

```
[ReactForget] TodoError: (BuildHIR::lowerMemberExpression) Handle optional chaining for non-optional member expr.
  4 |
  5 | function Component(props) {
> 6 |   let x = (props?.a).b;
    |                      ^
  7 |   return x;
  8 | }
  9 |
```
          
      