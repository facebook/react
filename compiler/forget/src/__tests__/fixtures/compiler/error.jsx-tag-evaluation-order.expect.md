
## Input

```javascript
function Component(props) {
  const maybeMutable = new MaybeMutable();
  let Tag = props.component;
  // NOTE: the order of evaluation in the lowering is incorrect:
  // the jsx element's tag observes `Tag` after reassignment, but should observe
  // it before the reassignment.
  return (
    <Tag>
      {((Tag = props.alternateComponent), maybeMutate(maybeMutable))}
      <Tag />
    </Tag>
  );
}

```


## Error

```
[ReactForget] Invariant: [Codegen] No value found for temporary. Value for 'read $33' was not set in the codegen context (8:8)
```
          
      