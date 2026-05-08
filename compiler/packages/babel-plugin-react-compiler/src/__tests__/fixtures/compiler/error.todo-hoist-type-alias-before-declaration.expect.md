
## Input

```javascript
// @flow @compilationMode(infer)
function Component(props: {data: Array<{label: string, value: number}>}) {
  const getLabel = (item: ItemType): string => item.label;
  const items = props.data.map(getLabel);
  type ItemType = {label: string, value: number};
  return <div>{items}</div>;
}

```


## Error

```
Found 1 error:

Todo: Unsupported declaration type for hoisting

variable "ItemType" declared with TypeAlias.

  1 | // @flow @compilationMode(infer)
  2 | function Component(props: {data: Array<{label: string, value: number}>}) {
> 3 |   const getLabel = (item: ItemType): string => item.label;
    |                           ^^^^^^^^ Unsupported declaration type for hoisting
  4 |   const items = props.data.map(getLabel);
  5 |   type ItemType = {label: string, value: number};
  6 |   return <div>{items}</div>;
```
          
      