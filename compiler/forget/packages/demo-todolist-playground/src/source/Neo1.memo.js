import React, { useState, useCallback } from "react";
import getUpdated from "./getUpdated";
import initialTodos from "./initialTodos";
import UnmemoizedTodo from "./NeoTodo";
import AddTodo from "./NeoAddTodo";

/**
 * Neo1 Minimal TodoList (manually memoized)
 *
 * Motivation:
 * Start with just `useState` (state var) and _pass things done_.
 */

const Todo = React.memo(UnmemoizedTodo);

function TodoList() {
  const [todos, setTodos] = useState(initialTodos);
  const handleChange = useCallback(
    todo => setTodos(todos => getUpdated(todos, todo)),
    []
  );

  return (
    <div>
      <ul>
        {todos.map(todo => (
          <Todo key={todo.id} todo={todo} onChange={handleChange} />
        ))}
      </ul>
      <AddTodo setTodos={setTodos} />
    </div>
  );
}

export default function App() {
  return (
    <div className="TodoListApp">
      <TodoList />
    </div>
  );
}
