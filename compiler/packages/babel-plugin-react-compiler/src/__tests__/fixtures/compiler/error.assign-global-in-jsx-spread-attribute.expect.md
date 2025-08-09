
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

Error: Cannot reassign variables declared outside of the component/hook

Reassigning this value during render is a form of side effect, which can cause unpredictable behavior depending on when the component happens to re-render. If this variable is used in rendering, use useState instead. Otherwise, consider updating it in an effect. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render).

error.assign-global-in-jsx-spread-attribute.ts:4:4
  2 | function Component() {
  3 |   const foo = () => {
> 4 |     someGlobal = true;
    |     ^^^^^^^^^^ Cannot reassign variables declared outside of the component/hook
  5 |   };
  6 |   return <div {...foo} />;
  7 | }
```
          
      