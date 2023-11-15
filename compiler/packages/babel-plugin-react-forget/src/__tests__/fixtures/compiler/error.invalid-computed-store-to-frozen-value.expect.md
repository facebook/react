
## Input

```javascript
function Component(props) {
  const x = makeObject();
  // freeze
  <div>{x}</div>;
  x[0] = true;
  return x;
}

```


## Error

```
[ReactForget] InvalidReact: This mutates a global or a variable after it was passed to React, which means that React cannot observe changes to it (5:5)
```
          
      