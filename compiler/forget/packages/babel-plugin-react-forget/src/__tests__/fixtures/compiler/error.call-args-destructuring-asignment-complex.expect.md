
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
[ReactForget] Invariant: Const declaration cannot be referenced as an expression (3:3)
```
          
      