import { useMemoCache } from "./useMemoCache";
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
  let $ = useMemoCache(5);
  const [todos, setTodos] = useState(initialTodos);
  let c_todos = $[1] !== todos;
  if (c_todos) $[1] = todos;

  const handleChange = $[2] || ($[2] = todo => setTodos(todos => getUpdated(todos, todo)));

  return c_todos ? $[4] = <div>
      {c_todos ? $[3] = <ul>
        {todos.map(todo => <Todo key={todo.id} todo={todo} onChange={handleChange} />)}
      </ul> : $[3]}
      <AddTodo setTodos={setTodos} />
    </div> : $[4];
}

export default function App() {
  let $ = useMemoCache(1);
  return <div className="TodoListApp">
      <TodoList />
    </div>;
}
