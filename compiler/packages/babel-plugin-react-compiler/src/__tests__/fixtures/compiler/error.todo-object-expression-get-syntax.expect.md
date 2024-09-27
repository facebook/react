
## Input

```javascript
function Component({value}) {
  const object = {
    get value() {
      return value;
    },
  };
  return <div>{object.value}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: foo,
  params: [{value: 0}],
  sequentialRenders: [{value: 1}, {value: 2}],
};

```


## Error

```
  1 | function Component({value}) {
  2 |   const object = {
> 3 |     get value() {
    |     ^^^^^^^^^^^^^
> 4 |       return value;
    | ^^^^^^^^^^^^^^^^^^^
> 5 |     },
    | ^^^^^^ Todo: (BuildHIR::lowerExpression) Handle get functions in ObjectExpression (3:5)
  6 |   };
  7 |   return <div>{object.value}</div>;
  8 | }
```
          
      