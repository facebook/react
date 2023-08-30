## Sprout 🌱
React Forget test framework that executes compiler fixtures.

Currently, Sprout runs each fixture with a known set of inputs and annotations. Sprout compares execution outputs (i.e. return values and console logs) of original source code and the corresponding Forget-transformed version.
We hope to add fuzzing capabilities to Sprout, synthesizing sets of program inputs based on type and/or effect annotations.

Sprout is now enabled for all fixtures! If Sprout cannot execute your fixture due to some technical limitations, add your fixture to [`SproutTodoFilter.ts`](./src/SproutTodoFilter.ts) with a comment explaining why.

### Sprout CLI
Sprout can be run from `packages/babel-plugin-react-forget`. When adding new fixtures to Sprout, please check that fixture outputs look reasonable with `yarn sprout --filter --verbose`.

```sh
# rebuild when sprout or babel-plugin-react-forget changes
$ yarn sprout:build

# evaluate all test fixtures not listed in SproutTodoFilter
$ yarn sprout

# show all sprout options
$ yarn sprout --help
Options:
  --sync     Run compiler in main thread.
                          [boolean] [default: false]
  --filter   Evaluate fixtures in filter mode.
                          [boolean] [default: false]
  --verbose  Print all fixture outputs and logs.
                          [boolean] [default: false]
```

Sprout can be run in filter mode with `yarn sprout --filter`. Just like Snap, Sprout expects `babel-plugin-react-forget/testfilter.txt` be formatted as such.
- *first line:* `// @only` or `// @skip`
- *all other lines:* a test fixture name, i.e. the relative path from the compiler fixtures dir, without a `.js` or `.expect.md` extension.

Example:
```c
// @only
console-readonly
constant-propagate-global-phis
dce-loop
```

### Adding fixtures to Sprout

#### 1. Annotate fixtures.
Each fixture test executed by Sprout needs to export const `FIXTURE_ENTRYPOINT` object with the following type signature.

```js
type FixtureEntrypoint<T> = {
  // function to be invoked
  fn: ((...params: Array<T>) => any),
  // params to pass to fn
  // (if `fn` is a react component, this should be an array
  // with exactly one element -- props)
  params: Array<T>,
}
```

Example:
```js
// test.js
function MyComponent(props) {
  return <div>{props.a + props.b}</div>;
}
export const FIXTURE_ENTRYPOINT = {
  fn: MyComponent,
  params: [{a: "hello ", b: "world"}],
};
```

#### 2. Import / define helper functions.

- Prefer importing helper functions for readability and simplicity.
- Fixtures that require helper functions with specific types or mutability can define their own within the same fixture file.

```js
// test.js
import { addOne } from 'shared-runtime';

function customHelper(val1, val2) {
  // This directive is important, as helper functions don't
  // always follow the rules of React.
  "use no forget";
  // ...
}

// ...
```

#### Notes
- If your fixture needs to import from an external module, we currently only support importing from `react` (see Milestones todo list).

- Any fixture can use React hooks, but they need to be first imported. We may later enforce that only `isComponent: true` fixtures can use React hooks.
    ```ts
    import {useState} from 'react';
    ```

- If your fixture wants to export multiple functions to Sprout to run, please split up the fixture into multiple files (e.g. `test-case-1`, `test-case-2`, etc).

- Sprout currently runs each fixture in an iife to prevent variable collisions, but it does not run fixtures in isolation. Please do not mutate any external state in fixtures.

- Sprout does not run fixtures listed in [`SproutTodoFilter.ts`](./src/SproutTodoFilter.ts), even in filter mode.

### Milestones:
- [✅] Render fixtures with React runtime / `testing-library/react`.
- [✅] Make Sprout CLI -runnable and report results in process exit code.
- [✅] Enable Sprout by default and run it in the Github Actions pipeline.
- [🚧] Make all existing test fixtures Sprout compatible (see `SproutTodoFilter.ts`). This involves each fixture being annotated with `FIXTURE_ENTRYPOINT` and using shared functions and/or defining its own helpers.
  - 77 done, ~410 to go
- [ ] *(optional)* Store Sprout output as snapshot files. i.e. each fixture could have a `fixture.js`, `fixture.snap.md`, and `fixture.sprout.md`.
- [ ] Add support for `fbt`.
