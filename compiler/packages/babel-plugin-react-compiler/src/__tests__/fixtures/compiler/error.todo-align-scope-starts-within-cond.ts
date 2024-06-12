/**
 * Similar fixture to `error.todo-align-scopes-nested-block-structure`, but
 * a simpler case.
 */
function useFoo(cond) {
  let s = null;
  if (cond) {
    s = {};
  } else {
    return null;
  }
  mutate(s);
  return s;
}
