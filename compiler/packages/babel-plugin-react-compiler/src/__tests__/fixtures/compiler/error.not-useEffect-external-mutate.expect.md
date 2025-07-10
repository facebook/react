
## Input

```javascript
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

error.not-useEffect-external-mutate.ts:5:4
  3 | function Component(props) {
  4 |   foo(() => {
> 5 |     x.a = 10;
    |     ^ Writing to a variable defined outside a component or hook is not allowed. Consider using an effect
  6 |     x.a = 20;
  7 |   });
  8 | }


Error: Writing to a variable defined outside a component or hook is not allowed. Consider using an effect

error.not-useEffect-external-mutate.ts:6:4
  4 |   foo(() => {
  5 |     x.a = 10;
> 6 |     x.a = 20;
    |     ^ Writing to a variable defined outside a component or hook is not allowed. Consider using an effect
  7 |   });
  8 | }
  9 |


```
          
      