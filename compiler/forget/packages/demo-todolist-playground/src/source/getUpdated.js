// Update an array in an immutable manner.
export default function getUpdated(todos, newTodo) {
  return todos
    .map(t => {
      if (t.id === newTodo.id) {
        return newTodo;
      } else {
        return t;
      }
    })
    .filter(t => !!t.text);
}
