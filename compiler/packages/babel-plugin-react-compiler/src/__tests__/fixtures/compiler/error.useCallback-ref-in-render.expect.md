
## Input

```javascript
// @flow @validateRefAccessDuringRender @validatePreserveExistingMemoizationGuarantees

component Foo() {
  const ref = useRef();

  const s = useCallback(() => {
    return ref.current;
  });

  return <a r={s} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
};

```


## Error

```
   4 |   const ref = useRef();
   5 |
>  6 |   const s = useCallback(() => {
     |                         ^^^^^^^
>  7 |     return ref.current;
     | ^^^^^^^^^^^^^^^^^^^^^^^
>  8 |   });
     | ^^^^ InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef). Cannot access ref value at read $27:TObject<BuiltInFunction> (6:8)
   9 |
  10 |   return <a r={s} />;
  11 | }
```
          
      