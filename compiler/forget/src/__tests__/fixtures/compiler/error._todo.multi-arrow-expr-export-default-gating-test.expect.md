
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
[ReactForget] InvalidInput: Skipping compilation: ArrowFunctionExpression must be declared in variable declaration (4:9)
```
          
      