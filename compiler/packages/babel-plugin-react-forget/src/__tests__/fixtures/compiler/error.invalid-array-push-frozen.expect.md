
## Input

```javascript
function Component(props) {
  const x = [];
  <div>{x}</div>;
  x.push(props.value);
  return x;
}

```


## Error

```
  2 |   const x = [];
  3 |   <div>{x}</div>;
> 4 |   x.push(props.value);
    |   ^ InvalidReact: Updating a value used previously in JSX is not allowed. Consider moving the mutation before the JSX (4:4)
  5 |   return x;
  6 | }
  7 |
```
          
      