
## Input

```javascript
function Component() {
  // Cannot assign to globals
  someUnknownGlobal = true;
  moduleLocal = true;
}

```


## Error

```
  1 | function Component() {
  2 |   // Cannot assign to globals
> 3 |   someUnknownGlobal = true;
    |   ^^^^^^^^^^^^^^^^^^^^^^^^ [ReactForget] InvalidReact: This reassigns a variable which was not defined inside of the component. Components should be pure and side-effect free. If this variable is used in rendering, use useState instead. (https://react.dev/learn/keeping-components-pure) (3:3)

[ReactForget] InvalidReact: This reassigns a variable which was not defined inside of the component. Components should be pure and side-effect free. If this variable is used in rendering, use useState instead. (https://react.dev/learn/keeping-components-pure) (4:4)
  4 |   moduleLocal = true;
  5 | }
  6 |
```
          
      