export default function getUpdated(tasks, newTodo) {
  return tasks
    .map(t => {
      if (t.id === newTodo.id) {
        return newTodo;
      } else {
        return t;
      }
    })
    .filter(t => !!t.text);
}
