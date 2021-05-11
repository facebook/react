import React, { useState, useRef } from "react";
import getUpdated from "./getUpdated";
import initialTodos from "./initialTodos";
import Todo from "./NeoTodo";
import AddTodo from "./NeoAddTodo";

/**
 * Neo1 Minimal TodoList
 *
 * Motivation:
 * Start with just `useState` (state var) and _pass things done_.
 */

function TodoList() {
  const [todos, setTodos] = useState(initialTodos);
  const handleChange = todo => setTodos(todos => getUpdated(todos, todo));

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
