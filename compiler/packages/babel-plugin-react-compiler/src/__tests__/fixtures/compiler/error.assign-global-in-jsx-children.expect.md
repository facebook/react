
## Input

```javascript
function Component() {
  const foo = () => {
    someGlobal = true;
  };
  // Children are generally access/called during render, so
  // modifying a global in a children function is almost
  // certainly a mistake.
  return <Foo>{foo}</Foo>;
}

```


## Error

```
  1 | function Component() {
  2 |   const foo = () => {
> 3 |     someGlobal = true;
    |     ^^^^^^^^^^ InvalidReact: Unexpected reassignment of a variable which was defined outside of the component. Components and hooks should be pure and side-effect free, but variable reassignment is a form of side-effect. If this variable is used in rendering, use useState instead. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#side-effects-must-run-outside-of-render) (3:3)
  4 |   };
  5 |   // Children are generally access/called during render, so
  6 |   // modifying a global in a children function is almost
```
          
      