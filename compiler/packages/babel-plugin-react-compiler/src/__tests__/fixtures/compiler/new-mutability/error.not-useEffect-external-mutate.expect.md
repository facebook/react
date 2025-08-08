
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

Error: This value cannot be modified

Cannot reassign variables declared outside of the component/hook.

error.not-useEffect-external-mutate.ts:6:4
  4 | function Component(props) {
  5 |   foo(() => {
> 6 |     x.a = 10;
    |     ^ value cannot be modified
  7 |     x.a = 20;
  8 |   });
  9 | }

Error: This value cannot be modified

Cannot reassign variables declared outside of the component/hook.

error.not-useEffect-external-mutate.ts:7:4
   5 |   foo(() => {
   6 |     x.a = 10;
>  7 |     x.a = 20;
     |     ^ value cannot be modified
   8 |   });
   9 | }
  10 |
```
          
      