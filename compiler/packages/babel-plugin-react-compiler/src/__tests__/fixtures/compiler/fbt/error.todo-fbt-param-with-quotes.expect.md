
## Input

```javascript
import fbt from "fbt";

function Component(props) {
  const element = (
    <fbt desc={"Dialog to show to user"}>
      Hello <fbt:param name='"user" name'>{props.name}</fbt:param>
    </fbt>
  );
  return element.toString();
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ name: "Jason" }],
};

```


## Error

```
  4 |   const element = (
  5 |     <fbt desc={"Dialog to show to user"}>
> 6 |       Hello <fbt:param name='"user" name'>{props.name}</fbt:param>
    |                             ^^^^^^^^^^^^^ Todo: Handle non-ascii character in fbt-like macro operand (6:6)
  7 |     </fbt>
  8 |   );
  9 |   return element.toString();
```
          
      