
## Input

```javascript
function useFoo(props) {
  let x;
  [x] = props;
  const foo = () => {
    x = getX(props);
  };
  foo();
  return { x };
}

```


## Error

```
[ReactForget] Invariant: Expected all references to a variable to be consistently local or context references. Identifier <unknown> x$1 is referenced as a local variable, but was previously referenced as a context variable (3:3)
```
          
      