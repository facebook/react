
## Input

```javascript
// @enableNewMutationAliasingModel
let x = {a: 42};

function Component(props) {
  foo(() => {
    x.a = 10;
    x.a = 20;
  });
}

```


## Error

```
Found 2 errors:
Error: Writing to a variable defined outside a component or hook is not allowed. Consider using an effect

error.not-useEffect-external-mutate.ts:6:4
  4 | function Component(props) {
  5 |   foo(() => {
> 6 |     x.a = 10;
    |     ^ Writing to a variable defined outside a component or hook is not allowed. Consider using an effect
  7 |     x.a = 20;
  8 |   });
  9 | }


Error: Writing to a variable defined outside a component or hook is not allowed. Consider using an effect

error.not-useEffect-external-mutate.ts:7:4
   5 |   foo(() => {
   6 |     x.a = 10;
>  7 |     x.a = 20;
     |     ^ Writing to a variable defined outside a component or hook is not allowed. Consider using an effect
   8 |   });
   9 | }
  10 |


```
          
      