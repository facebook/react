
## Input

```javascript
/**
 * Test conditional return in try block.
 * When condition is true, returns from try (but finally runs first).
 * When condition is false, falls through to after try-finally.
 */
function Component(props) {
  'use memo';
  try {
    if (props.cond) {
      return props.tryValue;
    }
  } finally {
    console.log('finally');
  }
  return props.fallbackValue;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{cond: true, tryValue: 'early-return', fallbackValue: 'fallback'}],
  sequentialRenders: [
    // Condition true - returns from try
    {cond: true, tryValue: 'early1', fallbackValue: 'fb1'},
    {cond: true, tryValue: 'early2', fallbackValue: 'fb2'},
    // Condition false - falls through
    {cond: false, tryValue: 'ignored', fallbackValue: 'used1'},
    {cond: false, tryValue: 'also-ignored', fallbackValue: 'used2'},
    // Same as previous, should reuse
    {cond: false, tryValue: 'also-ignored', fallbackValue: 'used2'},
    // Back to true
    {cond: true, tryValue: 'early3', fallbackValue: 'fb3'},
  ],
};

```

## Code

```javascript
/**
 * Test conditional return in try block.
 * When condition is true, returns from try (but finally runs first).
 * When condition is false, falls through to after try-finally.
 */
function Component(props) {
  "use memo";

  try {
    if (props.cond) {
      return props.tryValue;
    }
  } finally {
    console.log("finally");
  }
  return props.fallbackValue;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ cond: true, tryValue: "early-return", fallbackValue: "fallback" }],
  sequentialRenders: [
    // Condition true - returns from try
    { cond: true, tryValue: "early1", fallbackValue: "fb1" },
    { cond: true, tryValue: "early2", fallbackValue: "fb2" },
    // Condition false - falls through
    { cond: false, tryValue: "ignored", fallbackValue: "used1" },
    { cond: false, tryValue: "also-ignored", fallbackValue: "used2" },
    // Same as previous, should reuse
    { cond: false, tryValue: "also-ignored", fallbackValue: "used2" },
    // Back to true
    { cond: true, tryValue: "early3", fallbackValue: "fb3" },
  ],
};

```
      
### Eval output
(kind: ok) "early1"
"early2"
"used1"
"used2"
"used2"
"early3"
logs: ['finally','finally','finally','finally','finally','finally']