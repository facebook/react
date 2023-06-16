
## Input

```javascript
// @gating
const ErrorView = (error, _retry) => <MessageBox error={error}></MessageBox>;

export default Renderer = (props) => (
  <Foo>
    <Bar></Bar>
    <ErrorView></ErrorView>
  </Foo>
);

```


## Error

```
[ReactForget] Todo: ArrowFunctionExpression was not declared in a variable declaration. Handle AssignmentExpression (4:9)
```
          
      