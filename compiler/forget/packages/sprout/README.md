## Sprout
React Forget test framework that executes compiler fixtures.

Currently, Sprout runs each fixture with a known set of inputs and annotations. We hope to add fuzzing capabilities to Sprout, synthesizing sets of program inputs based on type and/or effect annotations.

Sprout is currently WIP and only executes files listed in `src/SproutOnlyFilterTodoRemove.ts`.

### Milestones:
- [x] Render fixtures with React runtime / `testing-library/react`.
- [x] Make Sprout CLI -runnable and report results in process exit code.
  After this point:
  - Sprout can be enabled by default and added to the Github Actions pipeline.
  - `SproutOnlyFilterTodoRemove` can be renamed to `SproutSkipFilter`.
  - All new tests should provide a `FIXTURE_ENTRYPOINT`.
- [ ] Annotate `FIXTURE_ENTRYPOINT` (fn entrypoint and params) for rest of fixtures.
- [ ] Edit rest of fixtures to use shared functions or define their own helpers.
- [ ] *(optional)* Store Sprout output as snapshot files. i.e. each fixture could have a `fixture.js`, `fixture.snap.md`, and `fixture.sprout.md`.

### Constraints
Each fixture test executed by Sprout needs to export a `FIXTURE_ENTRYPOINT`, a single function and parameter set with the following type signature.

```js
type FIXTURE_ENTRYPOINT<T> = {
  // function to be invoked
  fn: ((...params: Array<T>) => any),
  // params to pass to fn
  params: Array<T>,
  // true if fn should be rendered as a React Component
  //  i.e. returns jsx or primitives
  isComponent?: boolean,
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

