
## Input

```javascript
function Component(props) {
  let result;
  try {
    result = props.cond && props.foo;
  } catch (e) {
    console.log(e);
  }
  return result;
}

```


## Error

```
  2 |   let result;
  3 |   try {
> 4 |     result = props.cond && props.foo;
    |              ^^^^^ Todo: Support value blocks (conditional, logical, optional chaining, etc) within a try/catch statement (4:4)
  5 |   } catch (e) {
  6 |     console.log(e);
  7 |   }
```
          
      