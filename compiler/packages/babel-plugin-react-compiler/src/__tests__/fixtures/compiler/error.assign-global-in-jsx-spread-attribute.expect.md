
## Input

```javascript
// @enableNewMutationAliasingModel:false
function Component() {
  const foo = () => {
    someGlobal = true;
  };
  return <div {...foo} />;
}

```


## Error

```
Found 1 error:

Error: Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)

error.assign-global-in-jsx-spread-attribute.ts:4:4
  2 | function Component() {
  3 |   const foo = () => {
> 4 |     someGlobal = true;
    |     ^^^^^^^^^^ Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render)
  5 |   };
  6 |   return <div {...foo} />;
  7 | }
```
          
      