
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

Error: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)

error.validate-mutate-ref-arg-in-render.ts:3:14
  1 | // @validateRefAccessDuringRender:true
  2 | function Foo(props, ref) {
> 3 |   console.log(ref.current);
    |               ^^^^^^^^^^^ Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef)
  4 |   return <div>{props.bar}</div>;
  5 | }
  6 |
```
          
      