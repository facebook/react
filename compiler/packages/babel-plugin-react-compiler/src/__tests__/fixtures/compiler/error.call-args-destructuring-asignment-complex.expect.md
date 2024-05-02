
## Input

```javascript
function Component(props) {
  let x = makeObject();
  x.foo(([[x]] = makeObject()));
  return x;
}

```


## Error

```
  1 | function Component(props) {
  2 |   let x = makeObject();
> 3 |   x.foo(([[x]] = makeObject()));
    |          ^^^^^ Invariant: Const declaration cannot be referenced as an expression (3:3)
  4 |   return x;
  5 | }
  6 |
```
          
      