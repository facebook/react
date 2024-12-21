
## Input

```javascript
// @validateNoJSXInTryStatements
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
  3 |   let el;
  4 |   try {
> 5 |     el = <div />;
    |          ^^^^^^^ InvalidReact: Unexpected JSX element within a try statement. To catch errors in rendering a given component, wrap that component in an error boundary. (https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) (5:5)
  6 |   } catch {
  7 |     return null;
  8 |   }
```
          
      