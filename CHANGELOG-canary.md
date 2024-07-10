## March 22, 2024 (18.3.0-canary-670811593-20240322)

## React
- Added `useActionState` to replace `useFormState` and added `pending` value ([#28491](https://github.com/facebook/react/pull/28491)).

## October 5, 2023 (18.3.0-canary-546178f91-20231005)

### React

- Added support for async functions to be passed to `startTransition`. 
- `useTransition` now triggers the nearest error boundary instead of a global error.
- Added `useOptimistic`, a new Hook for handling optimistic UI updates. It optimistically updates the UI before receiving confirmation from a server or external source.

### React DOM

- Added support for passing async functions to the `action` prop on `<form>`. When the function passed to `action` is marked with [`'use server'`](https://react.dev/reference/react/use-server), the form is [progressively enhanced](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement).
- Added `useFormStatus`, a new Hook for checking the submission state of a form.
- Added `useFormState`, a new Hook for updating state upon form submission. When the function passed to `useFormState` is marked with [`'use server'`](https://react.dev/reference/react/use-server), the update is [progressively enhanced](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement).
