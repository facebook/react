
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
  3 |   // freeze
  4 |   <div>{x}</div>;
> 5 |   x[0] = true;
    |   ^ InvalidReact: Updating a value used previously in JSX is not allowed. Consider moving the mutation before the JSX (5:5)
  6 |   return x;
  7 | }
  8 |
```
          
      