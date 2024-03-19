
## Input

```javascript
import fbt from "fbt";

function Component({ a, b }) {
  return (
    <fbt desc="Description">
      <fbt:enum enum-range={["avalue1", "avalue1"]} value={a} />{" "}
      <fbt:enum enum-range={["bvalue1", "bvalue2"]} value={b} />
    </fbt>
  );
}

```


## Error

```
avalue1 not found in { bvalue1: 'bvalue1', bvalue2: 'bvalue2' }. Attempting to re-use incompatible enums
```
          
      