
## Input

```javascript
// @validateNoSetStateInRender @enableTreatSetIdentifiersAsStateSetters
function Component({setX}) {
  const aliased = setX;

  setX(1);
  aliased(2);

  return x;
}

```

## Code

```javascript
// @validateNoSetStateInRender @enableTreatSetIdentifiersAsStateSetters
function Component(t0) {
  const { setX } = t0;
  const aliased = setX;

  setX(1);
  aliased(2);
  return x;
}

```
      
### Eval output
(kind: exception) Fixture not implemented