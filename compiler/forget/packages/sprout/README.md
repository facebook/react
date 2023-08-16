## Sprout 🌱
React Forget test framework that executes compiler fixtures.

Currently, Sprout runs each fixture with a known set of inputs and annotations. Sprout compares execution outputs (i.e. return values and console logs) of original source code and the corresponding Forget-transformed version.
We hope to add fuzzing capabilities to Sprout, synthesizing sets of program inputs based on type and/or effect annotations.

Sprout is now enabled for all fixtures! If Sprout cannot execute your fixture due to some technical limitations, add your fixture to `packages/sprout/src/SproutTodoFilter.ts` with a comment explaining why.


### How to use Sprout
Each fixture test executed by Sprout needs to export const `FIXTURE_ENTRYPOINT` object with the following type signature.

```js
type FixtureEntrypoint<T> = {
  // function to be invoked
  fn: ((...params: Array<T>) => any),
  // params to pass to fn
  params: Array<T>,
  // true if fn should be rendered as a React Component (i.e. returns jsx)
  isComponent: boolean,
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
  isComponent: true,
};
```

Additional notes:
- If your fixture needs a helper function, the current solution is to define it in the same fixture file.

- If your fixture needs to import from an external module, we currently only support importing from `react` (see Milestones todo list).

- Any fixture can use React hooks, but they need to be first imported. We may later enforce that only `isComponent: true` fixtures can use React hooks.
    ```ts
    import {useState} from 'react';
    ```

- If your fixture wants to export multiple functions to Sprout to run, please split up the fixture into multiple files (e.g. `test-case-1`, `test-case-2`, etc).

- Sprout currently runs each fixture in an iife to prevent variable collisions, but it does not run fixtures in isolation. Please do not write to globals or mutate React library module state in fixtures.

### Milestones:
- [x] Render fixtures with React runtime / `testing-library/react`.
- [x] Make Sprout CLI -runnable and report results in process exit code.
  After this point:
  - Sprout can be enabled by default and added to the Github Actions pipeline.
  - `SproutOnlyFilterTodoRemove` can be renamed to `SproutSkipFilter`.
  - All new tests should provide a `FIXTURE_ENTRYPOINT`.
- [ ] Annotate `FIXTURE_ENTRYPOINT` (fn entrypoint and params) for rest of fixtures (see `SproutTodoFilter.ts`).
- [ ] Edit rest of fixtures to use shared functions or define their own helpers.
- [ ] *(optional)* Store Sprout output as snapshot files. i.e. each fixture could have a `fixture.js`, `fixture.snap.md`, and `fixture.sprout.md`.
- [ ] Add support for `fbt`.
