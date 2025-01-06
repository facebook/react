
## Input

```javascript
// @enableReactiveGraph
function Component(props) {
  const elements = [];
  if (props.value) {
    elements.push(<div>{props.value}</div>);
  }
  return elements;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableReactiveGraph
function Component(props) {
  const $ = _c(2);
  let elements;
  if ($[0] !== props.value) {
    elements = [];
    if (props.value) {
      elements.push(<div>{props.value}</div>);
    }
    $[0] = props.value;
    $[1] = elements;
  } else {
    elements = $[1];
  }
  return elements;
}

```
      
### Eval output
(kind: exception) Fixture not implemented