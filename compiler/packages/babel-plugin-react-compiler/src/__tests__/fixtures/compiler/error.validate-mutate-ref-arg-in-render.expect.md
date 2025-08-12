
## Input

```javascript
// @validateRefAccessDuringRender:true
function Foo(props, ref) {
  console.log(ref.current);
  return <div>{props.bar}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{bar: 'foo'}, {ref: {cuurrent: 1}}],
  isComponent: true,
};

```


## Error

```
Found 1 error:

Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef)

error.validate-mutate-ref-arg-in-render.ts:3:14
  1 | // @validateRefAccessDuringRender:true
  2 | function Foo(props, ref) {
> 3 |   console.log(ref.current);
    |               ^^^^^^^^^^^ Passing a ref to a function may read its value during render
  4 |   return <div>{props.bar}</div>;
  5 | }
  6 |
```
          
      