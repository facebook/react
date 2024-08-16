
## Input

```javascript
function Component(props) {
  let el;
  try {
    el = <div />;
  } catch {
    return null;
  }
  return el;
}

```


## Error

```
  2 |   let el;
  3 |   try {
> 4 |     el = <div />;
    |          ^^^^^^^ InvalidReact: Unexpected JSX element within a try statement. To catch errors in rendering a given component, wrap that component in an error boundary. (https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) (4:4)
  5 |   } catch {
  6 |     return null;
  7 |   }
```
          
      