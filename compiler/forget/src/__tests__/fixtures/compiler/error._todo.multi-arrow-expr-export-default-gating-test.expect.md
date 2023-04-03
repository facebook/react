
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
ArrowFunctionExpression must be declared in variable declaration
```
          
      